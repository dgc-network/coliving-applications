const ethWeb3ProviderEndpoint = 'http://localhost:8546'
require('@openzeppelin/test-helpers/configure')({
  provider: ethWeb3ProviderEndpoint,
})

const { time } = require('@openzeppelin/test-helpers')

const args = process.argv
if (args.length < 3) {
  console.log('Need to provide block number arg')
}

const blockNumber = parseInt(args[2])

// Advance blocks to block defined
time.advanceBlockTo(blockNumber).then(res => {
  console.log(res)
  console.log('Done')
})