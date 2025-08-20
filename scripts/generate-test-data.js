const fs = require('fs')
const path = require('path')

// Generate large arrays for testing
function generateLargeArrays() {
  const largePrimitiveArray = {
    before: {
      numbers: Array.from({ length: 1500 }, (_, i) => i)
    },
    after: {
      numbers: Array.from({ length: 1500 }, (_, i) => i + Math.floor(Math.random() * 10))
    }
  }

  const largeObjectArray = {
    before: {
      users: Array.from({ length: 1200 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        age: 20 + (i % 50),
        active: i % 2 === 0
      }))
    },
    after: {
      users: Array.from({ length: 1200 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        age: 20 + (i % 50) + Math.floor(Math.random() * 5),
        active: i % 3 === 0
      }))
    }
  }

  return { largePrimitiveArray, largeObjectArray }
}

// Update the fixtures file
function updateFixtures() {
  const fixturesPath = path.join(__dirname, '..', 'fixtures', 'large-arrays.json')
  const largeData = generateLargeArrays()
  
  const fixtures = {
    "large-primitive-array": largeData.largePrimitiveArray,
    "large-object-array": largeData.largeObjectArray
  }

  fs.writeFileSync(fixturesPath, JSON.stringify(fixtures, null, 2))
  console.log('Generated large test data in fixtures/large-arrays.json')
}

if (require.main === module) {
  updateFixtures()
}
