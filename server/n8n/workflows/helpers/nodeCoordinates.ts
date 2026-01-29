const nodeCoordinates = {
  'merge-trigger': [-1664, 256],
  'get-agent-data': [-1344, 144],
  'prepare-context': [-752, 288],
  reflection: [-480, 512],
  'fetch-mindlogs': [-1344, 400],
  merge: [-992, 288],
  'merge-context': [-224, 304],
  'prepare-agent-input': [-48, 304],
  agent: [112, 304],
  'workflow-trigger': [-1888, 128],
  'chat-trigger': [-2224, 336],
  memory: [208, 560],
  'workflow-output': [464, 304],
  'if-not-streaming': [672, 304],
  'respond-webhook': [880, 304],
  'get-user-by-token': [-2032, 464],
  'set-auth-context': [-1872, 496],
  'tool-create-mindlog': [1248, 720],
  'tool-update-mindlog': [1248, 864],
  'tool-delete-mindlog': [1248, 1024],
  'tool-search-mindlogs': [1248, 544],
  'tool-create-task': [1968, 704],
  'tool-update-task': [1968, 848],
  'tool-delete-task': [1968, 1008],
  'tool-search-tasks': [1968, 528],
  'tool-create-task-work-log': [2208, 704],
  'tool-search-task-work-log': [1968, 528],
  'tool-delete-task-work-log': [2208, 848],
  'tool-kb-concept': [1504, 544],
  'tool-kb-fact': [1504, 688],
  'tool-kb-fact-participation': [1504, 832],
  'tool-kb-fact-projection': [1504, 1120],
  'tool-kb-knowledge-space': [1504, 1024],
  'tool-ex-reflex': [1728, 544],
  'tool-ex-reaction': [1728, 688],
  'tool-web-search-agent': [2656, 544],
  'tool-fetch': [2432, 544],
  'tool-read-file': [1568, 512],
  'tool-list-files': [1792, 512],
  'tool-graphql': [224, 512],
  'tool-get-user-by-token-trigger': [-400, 200],
  'tool-get-user-by-token-manual': [-400, 400],
  'tool-get-user-by-token-set-test': [-200, 400],
  'tool-get-user-by-token-prepare': [-200, 200],
  'tool-get-user-by-token-check': [0, 200],
  'tool-get-user-by-token-http': [200, 100],
  'tool-get-user-by-token-set-user': [400, 100],
  'tool-get-user-by-token-set-no-user': [200, 300],
  'tool-get-config-trigger': [-200, 304],
  'tool-get-config-manual': [-200, 504],
  'tool-get-config-code': [0, 304],
  'tool-fetch-request-trigger': [-200, 304],
  'tool-fetch-request-manual': [-200, 504],
  'tool-fetch-request-set-test': [0, 504],
  'tool-fetch-request-http': [200, 304],
  'tool-get-user-data-trigger': [-400, 300],
  'tool-get-user-data-set-query': [0, 300],
  'tool-get-user-data-manual': [-400, 500],
  'tool-get-user-data-http': [200, 300],
  'tool-graphql-request-trigger': [-400, 300],
  'tool-graphql-request-parse': [0, 300],
  'tool-graphql-request-manual': [-400, 500],
  'tool-graphql-request-set-test': [0, 500],
  'tool-graphql-request-merge-config': [400, 300],
  'tool-graphql-request-http': [800, 300],
  'tool-graphql-request-handle-response': [1200, 300],
  'tool-graphql-request-user-trigger': [-400, 300],
  'tool-graphql-request-user-parse': [0, 300],
  'tool-graphql-request-user-manual': [-400, 500],
  'tool-graphql-request-user-set-test': [0, 500],
  'tool-graphql-request-user-merge-config': [400, 300],
  'tool-graphql-request-user-http': [800, 300],
  'tool-graphql-request-user-handle-response': [1200, 300],
  'tool-read-file-trigger': [-200, 304],
  'tool-read-file-manual': [-200, 504],
  'tool-read-file-set-test': [0, 504],
  'tool-read-file-execute': [200, 304],
  'tool-list-files-trigger': [-200, 304],
  'tool-list-files-manual': [-200, 504],
  'tool-list-files-set-test': [0, 504],
  'tool-list-files-execute': [200, 304],
  'loop-runner-trigger': [0, 300],
  'loop-runner-execute': [220, 300],
  'loop-runner-wait': [440, 300],
  'loop-handler-trigger': [0, 300],
  'loop-handler-wait': [220, 300],
  'loop-handler-code': [440, 300],
  'mcp-server-trigger': [0, 200],
  'mcp-server-check-token': [200, 200],
  'mcp-server-get-user': [400, 100],
  'mcp-server-set-user': [600, 100],
  'mcp-server-set-no-user': [400, 300],
  'mcp-server-call-agent': [800, 200],
  'mcp-server-mcp-trigger': [368, 96],
  'mcp-server-send-message': [680, 200],
  'error-handler-trigger': [256, 304],
  'error-handler-set-data': [480, 304],
  'error-handler-sticky-note': [-208, 160],
  'error-handler-log': [704, 304],
  'telegram-handler-trigger': [-96, 304],
  'telegram-handler-call-agent': [1056, 320],
  'telegram-handler-send-message': [1312, 320],
  'telegram-handler-speech-to-text': [816, 208],
  'telegram-handler-voice-or-text': [224, 304],
  'telegram-handler-get-voice': [576, 208],
  'telegram-handler-sticky-note': [192, 128],
  'telegram-handler-if': [384, 304],
  'test-execute-script-trigger': [-200, 304],
  'test-execute-script-execute': [0, 304],
  'verify-token-trigger': [0, 300],
  'verify-token-graphql': [220, 300],
  'verify-token-set-output': [440, 300],
  'reflection-trigger': [-400, 300],
  'reflection-manual': [-400, 500],
  'reflection-set-test': [0, 500],
  'reflection-process': [200, 300],
} as const

export type NodeId = keyof typeof nodeCoordinates

export function getNodeCoordinates(nodeId: NodeId): [number, number] {
  const coords = nodeCoordinates[nodeId]
  if (!coords) {
    throw new Error(`Unknown node ID: ${nodeId}`)
  }
  return [coords[0], coords[1]]
}

export function getNodeCoordinatesOffset(
  nodeId: NodeId,
  offsetX: number = 0,
  offsetY: number = 0,
): [number, number] {
  const [x, y] = getNodeCoordinates(nodeId)
  return [x + offsetX, y + offsetY]
}

export const GRID_SPACING = 144

export function getGridPosition(
  row: number,
  column: number,
  baseX: number = 0,
  baseY: number = 0,
): [number, number] {
  return [baseX + column * GRID_SPACING, baseY + row * GRID_SPACING]
}

export function getToolGridPosition(
  toolIndex: number,
  baseX: number = 1248,
  baseY: number = 544,
): [number, number] {
  const row = Math.floor(toolIndex / 1)
  const spacing = 144
  return [baseX, baseY + row * spacing]
}
