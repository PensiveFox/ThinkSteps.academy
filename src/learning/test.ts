const { evaluateStudent } = require('./learningEngine')

async function test() {
  console.log('🧪 Testing learning engine...')
  
  try {
    const result = await evaluateStudent('test-user-id')
    console.log('✅ Result:', result)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

test()
