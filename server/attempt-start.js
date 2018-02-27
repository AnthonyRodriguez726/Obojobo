const Assessment = require('./assessment')
const DraftModel = oboRequire('models/draft')
const createCaliperEvent = oboRequire('routes/api/events/create_caliper_event')
const insertEvent = oboRequire('insert_event')
const logger = oboRequire('logger')
const logAndRespondToUnexpected = require('./util').logAndRespondToUnexpected

const QUESTION_BANK_NODE_TYPE = 'ObojoboDraft.Chunks.QuestionBank'
const QUESTION_NODE_TYPE = 'ObojoboDraft.Chunks.Question'
const ACTION_ASSESSMENT_ATTEMPT_START = 'assessment:attemptStart'
const ACTION_ASSESSMENT_SEND_TO_ASSESSMENT = 'ObojoboDraft.Sections.Assessment:sendToAssessment'
const ERROR_ATTEMPT_LIMIT_REACHED = 'Attempt limit reached'
const ERROR_UNEXPECTED_DB_ERROR = 'Unexpected DB error'

const startAttempt = (req, res) => {
  let assessmentProperties = {}
  let attemptState

  req.requireCurrentUser()
    .then(user => {
      assessmentProperties = updateAssessmentProperties(assessmentProperties, {
        user,
        isPreviewing: user.canViewEditor
      })

      return DraftModel.fetchById(req.body.draftId)
    })
    .then(draftTree => {
      const assessmentNode = draftTree.getChildNodeById(req.body.assessmentId)

      assessmentProperties = updateAssessmentProperties(assessmentProperties, {
        draftTree,
        id: req.body.assessmentId,
        node: assessmentNode,
        nodeChildrenIds: assessmentNode.children[1].childrenSet,
        assessmentQBTree: assessmentNode.children[1].toObject()
      })

      return Assessment.getCompletedAssessmentAttemptHistory(
        assessmentProperties.user.id,
        req.body.draftId,
        req.body.assessmentId,
        true
      )
    })
    .then(attemptHistory => {
      assessmentProperties = updateAssessmentProperties(assessmentProperties, { attemptHistory })

      return Assessment.getNumberAttemptsTaken(
        assessmentProperties.user.id,
        req.body.draftId,
        req.body.assessmentId
      )
    })
    .then(numAttemptsTaken => {
      assessmentProperties = updateAssessmentProperties(assessmentProperties, { numAttemptsTaken })

      // If we're in preview mode, allow unlimited attempts, else throw an error
      // when trying to start an assessment with no attempts left.
      if (
        !assessmentProperties.isPreviewing
        && assessmentProperties.node.content.attempts
        && assessmentProperties.numAttemptsTaken >= assessmentProperties.node.content.attempts
      )
        throw new Error(ERROR_ATTEMPT_LIMIT_REACHED)

      assessmentProperties = updateAssessmentProperties(assessmentProperties, {
        childrenMap: getAssessmentChildrenMap(assessmentProperties)
      })

      for (let attempt of assessmentProperties.attemptHistory) {
        if (attempt.state.qb) {
          incrementUsedQuestionIds(attempt.state.qb, assessmentProperties.childrenMap)
        }
      }

      createChosenQuestionTree(assessmentProperties.assessmentQBTree, assessmentProperties)

      attemptState = {
        qb: assessmentProperties.assessmentQBTree,
        questions: getNodeQuestions(assessmentProperties.assessmentQBTree, assessmentProperties.node, []),
        data: {}
      }

      return Promise.all(getSendToClientPromises(attemptState, req, res))
    })
    .then(() => {
      const questionObjects = attemptState.questions.map(q => q.toObject())

      return Assessment.insertNewAttempt(
        assessmentProperties.user.id,
        req.body.draftId,
        req.body.assessmentId,
        {
          questions: questionObjects,
          data: attemptState.data,
          qb: assessmentProperties.assessmentQBTree
        },
        assessmentProperties.isPreviewing
      )
    })
    .then(result => {
      res.success(result)
      const { createAssessmentAttemptStartedEvent } = createCaliperEvent(null, req.hostname)
      insertEvent({
        action: ACTION_ASSESSMENT_ATTEMPT_START,
        actorTime: new Date().toISOString(),
        payload: { attemptId: result.attemptId, attemptCount: assessmentProperties.numAttemptsTaken },
        userId: assessmentProperties.user.id,
        ip: req.connection.remoteAddress,
        metadata: {},
        draftId: req.body.draftId,
        eventVersion: '1.1.0',
        caliperPayload: createAssessmentAttemptStartedEvent({
          actor: { type: 'user', id: assessmentProperties.user.id },
          draftId: req.body.draftId,
          assessmentId: req.body.assessmentId,
          attemptId: result.attemptId,
          isPreviewMode: assessmentProperties.isPreviewing,
          extensions: {
            count: assessmentProperties.numAttemptsaken
          }
        })
      })
    })
    .catch(error => {
      switch (error.message) {
        case ERROR_ATTEMPT_LIMIT_REACHED:
          return res.reject(ERROR_ATTEMPT_LIMIT_REACHED)
        default:
          logAndRespondToUnexpected(ERROR_UNEXPECTED_DB_ERROR, res, req, error)
      }
    })
}

// Choose is the number of questions to show per attempt, select indicates how to display them.
const getQuestionBankProperties = questionBankNode => ({
  choose: questionBankNode.content.choose || Infinity,
  select: questionBankNode.content.select || 'sequential'
})

// This map will be used to keep track of the questions we have used/have
// left to display.
const getAssessmentChildrenMap = assessmentProperties => {
  const assessmentChildrenMap = new Map()
  assessmentProperties.nodeChildrenIds.forEach(id => {
    const type = assessmentProperties.draftTree.getChildNodeById(id).node.type
    if (type === QUESTION_BANK_NODE_TYPE || type === QUESTION_NODE_TYPE)
      assessmentChildrenMap.set(id, 0)
  })

  return assessmentChildrenMap
}

// When a question has been used, we will increment the value
// pointed to by the node's id in our usedMap (a.k.a childrenMap).
// This will allow us to know which questions to show next.
const incrementUsedQuestionIds = (node, usedMap) => {
  if (usedMap.has(node.id))
    usedMap.set(node.id, usedMap.get(node.id) + 1)

  for (let child of node.children)
    incrementUsedQuestionIds(child, usedMap)
}

const chooseQuestionsSequentially = (numQuestionsPerAttempt, node, assessmentProperties) => {
  const { childrenMap } = assessmentProperties
  const draftNode = assessmentProperties.node.draftTree.getChildNodeById(node.id)
  const nodeChildren = [...draftNode.immediateChildrenSet]

  // Sort the questions by how many times they were used (after incrementing
  // with incrementUsedQuestionIds).
  const nodeChildrenDraftNodes = nodeChildren
    .sort((a, b) => childrenMap.get(a) - childrenMap.get(b))
    .map(id => assessmentProperties.node.draftTree.getChildNodeById(id).toObject())

  return nodeChildrenDraftNodes.slice(0, numQuestionsPerAttempt)
}

// This will narrow down the assessment tree to question banks
// with their respectively selected questions.
const createChosenQuestionTree = (node, assessmentProperties) => {
  if (node.type === QUESTION_BANK_NODE_TYPE) {
    logger.log('TEST', node.id, node.content, node.content.choose)
    const qbProperties = getQuestionBankProperties(node)

    // TODO: 'random-all' and 'random-unseen' selects need to be taken care of as well.
    node.children = chooseQuestionsSequentially(qbProperties.choose, node, assessmentProperties)
  }

  for (let child of node.children)
    createChosenQuestionTree(child, assessmentProperties)
}

// Return an array of question type nodes from a node tree.
const getNodeQuestions = (node, assessmentNode, questions) => {
  if (node.type === QUESTION_NODE_TYPE) {
    questions.push(assessmentNode.draftTree.getChildNodeById(node.id))
  }

  for (let child of node.children) {
    questions.concat(getNodeQuestions(child, assessmentNode, questions))
  }

  return questions
}

// Return an array of promises that could be the result of yelling an
// assessment:sendToAssessment event.
const getSendToClientPromises = (attemptState, req, res) => {
  let promises = []
  for (let q of attemptState.questions) {
    promises = promises.concat(q.yell(ACTION_ASSESSMENT_SEND_TO_ASSESSMENT, req, res))
  }

  return promises
}

const updateAssessmentProperties = (currentProps, nextProps) => {
  return Object.assign(currentProps, nextProps)
}

module.exports = {
  startAttempt,
  getQuestionBankProperties,
  getAssessmentChildrenMap,
  incrementUsedQuestionIds,
  chooseQuestionsSequentially,
  createChosenQuestionTree,
  getNodeQuestions,
  getSendToClientPromises,
  updateAssessmentProperties
}