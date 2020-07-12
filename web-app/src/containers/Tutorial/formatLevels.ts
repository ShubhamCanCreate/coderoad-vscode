import * as T from 'typings'
import * as TT from 'typings/tutorial'

interface Input {
  progress: T.Progress
  position: T.Position
  levels: TT.Level[]
  testStatus: T.TestStatus | null
}

type Output = {
  level: T.LevelUI
  levels: T.LevelUI[]
  stepIndex: number
}

/*
 * Format levels to include:
 * - level.status = 'ACTIVE' | 'COMPLETE' | 'INCOMPLETE'
 * - step.status = 'ACTIVE' | 'COMPLETE' | 'INCOMPLETE' | 'FAIL'
 * - step.subtasks as { name: string, status: 'ACTIVE' | 'COMPLETE' | 'INCOMPLETE' }[]
 */
const formatLevels = ({ progress, position, levels, testStatus }: Input): Output => {
  // clone levels

  const levelIndex: number = levels.findIndex((l: TT.Level) => l.id === position.levelId)

  if (levelIndex === -1) {
    throw new Error(`Level ${position.levelId} not found`)
  }

  const currentLevel = levels[levelIndex]

  const levelUI: T.LevelUI = {
    ...currentLevel,
    status: progress.levels[position.levelId] ? 'COMPLETE' : 'ACTIVE',
    steps: currentLevel.steps.map((step: TT.Step) => {
      // label step status for step component
      let status: T.ProgressStatus = 'INCOMPLETE'
      let subtasks
      if (progress.steps[step.id]) {
        status = 'COMPLETE'
      } else if (step.id === position.stepId) {
        status = 'ACTIVE'
        if (step.subtasks && step.subtasks) {
          subtasks = step.subtasks.map((subtask: string, subtaskIndex: number) => {
            let subtaskStatus: T.ProgressStatus = 'INCOMPLETE'
            // task is complete, subtasks must be complete
            if (status === 'COMPLETE') {
              subtaskStatus = 'COMPLETE'
              // task is active, check which are complete from test results
            } else if (status === 'ACTIVE') {
              subtaskStatus = !!(testStatus?.summary && testStatus.summary[subtaskIndex]) ? 'COMPLETE' : 'ACTIVE'
            }
            return {
              name: subtask,
              status: subtaskStatus,
            }
          })
        }
      }
      return { ...step, status, subtasks }
    }),
  }

  const completed: T.LevelUI[] = levels.slice(0, levelIndex).map((level: TT.Level) => ({
    ...level,
    status: 'COMPLETE',
    steps: level.steps.map((step: TT.Step) => ({
      ...step,
      status: 'COMPLETE',
      subtasks: step.subtasks ? step.subtasks.map((st) => ({ name: st, status: 'COMPLETE' })) : undefined,
    })),
  }))

  const incompleted: T.LevelUI[] = levels.slice(levelIndex + 1, levels.length).map((level: TT.Level) => ({
    ...level,
    status: 'INCOMPLETE',
    steps: level.steps.map((step: TT.Step) => ({
      ...step,
      status: 'INCOMPLETE',
      subtasks: step.subtasks ? step.subtasks.map((st) => ({ name: st, status: 'INCOMPLETE' })) : undefined,
    })),
  }))

  const levelsUI: T.LevelUI[] = [...completed, levelUI, ...incompleted]

  let stepIndex = levelUI.steps.findIndex((s: T.StepUI) => s.status === 'ACTIVE')
  if (stepIndex === -1) {
    stepIndex = levels[levelIndex].steps.length
  }
  return { level: levelUI, levels: levelsUI, stepIndex }
}

export default formatLevels
