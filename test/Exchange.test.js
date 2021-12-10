import { initial } from 'lodash'
import { tokens, ether, EVM_REVERT, ETHER_ADDRESS } from './helpers'

const { default: web3 } = require('web3')

const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
    let token
    let exchange
    const feePercent = 10 // This is for easy math

    beforeEach(async () => {
        // Deploy token
        token = await Token.new()
        // Transfer some tokens to user 1 or EVM_REVERT will occur
        token.transfer(user1, tokens(100), {from: deployer})
        // Deploy Exchange
        exchange = await Exchange.new(feeAccount, feePercent)
       
    })

    describe('deployment', () => {
        it('tracks the fee account', async () => {
            const result = await exchange.feeAccount()
            result.should.equal(feeAccount)
        })

        it('tracks the fee percent', async () => {
            const result = await exchange.feePercent()
            result.toString().should.equal(feePercent.toString())
        })
        
    })

    describe('fallback', () => {
      it('reverts when Ether is sent', async () => {
        await exchange.sendTransaction({value: 1, from: user1}).should.be.rejectedWith(EVM_REVERT)
      } )
    })

    describe('despositing Ether', async () => {
      let result
      let amount

      beforeEach(async () => {
        amount = ether(1)
        result = await exchange.depositEther({from: user1, value: amount})
      })
      it('tracks the Ether deposit', async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1)
        balance.toString().should.equal(amount.toString())
      })

      it('emits a Deposit event', async () => {
        const log = result.logs[0]
        log.event.should.eq('Deposit')
        const event = log.args
        event.token.toString().should.equal(ETHER_ADDRESS, 'token address is correct')
        event.user.should.equal(user1, 'user address is correct')
        event.amount.toString().should.equal(amount.toString(), 'amount is correct')
        event.balance.toString().should.equal(amount.toString(), 'balance is correct')
       })
    })

    describe('withdrawing Ether', async () => {      
      let result
      let amount

      beforeEach(async () => {
        // Deposit Ether first
        amount = ether(1)
        await exchange.depositEther({from: user1, value: amount})
      })

      describe('success', async () => {
        beforeEach(async () => {
            // Withdraw Ether
        result = await exchange.withdrawEther(amount, {from: user1})
        })

        it('withdraws Ether funds', async () => {
          const balance = await exchange.tokens(ETHER_ADDRESS, user1)
          balance.toString().should.equal('0')
        })

        it('emits a Withdraw event', async () => {
          const log = result.logs[0]
          log.event.should.eq('Withdraw')
          const event = log.args
          event.token.toString().should.equal(ETHER_ADDRESS)
          event.user.should.equal(user1)
          event.amount.toString().should.equal(amount.toString())
          event.balance.toString().should.equal('0')
         })
      })

      describe('failure', async () => {
        it('rejects withdrawls for insufficient balances', async () => {
          // Reference Ln 75
          await exchange .withdrawEther(ether(100), {from: user1}).should.be.rejectedWith(EVM_REVERT);
        })
        
      })

    })

    describe('depositing tokens', () => {
      let result
      let amount

    
      describe('success', () => {
        beforeEach(async () => {
          amount = tokens(10)
          await token.approve(exchange.address, tokens(10), {from: user1})
          result = await exchange.depositToken(token.address, tokens(10), {from: user1})
        })
        it('tracks the token deposit', async () => {
          // Check exchange token balance
          let balance
          balance = await token.balanceOf(exchange.address)
          balance.toString().should.equal(amount.toString())
          // Checks tokens on Exchange
          balance = await exchange.tokens(token.address, user1)
          balance.toString().should.equal(amount.toString())
        })

        it('emits a Deposit event', async () => {
          const log = result.logs[0]
          log.event.should.eq('Deposit')
          const event = log.args
          event.token.toString().should.equal(token.address, 'token address is correct')
          event.user.should.equal(user1, 'user address is correct')
          event.amount.toString().should.equal(amount.toString(), 'amount is correct')
          event.balance.toString().should.equal(amount.toString(), 'balance is correct')
         })
      })
      describe('failure', () => {
        it('rejects Ether deposits', async () => {
          await exchange.depositToken(ETHER_ADDRESS, tokens(10), {from: user1}).should.be.rejectedWith(EVM_REVERT)
        })
        it('fails when no tokens are approved', async () => {
          // Don't approve any tokens before depositing
          await exchange.depositToken(token.address, tokens(10), {from: user1}).should.be.rejectedWith(EVM_REVERT);
        })
      })
    })

    describe('withdrawing tokens', async () => {
      let result
      let amount

      describe('success', async () => {
        beforeEach(async () => {
          // Deposit token, but to deposit tokens we must approve first
          amount = tokens(10)
          await token.approve(exchange.address, amount, {from: user1})
          await exchange.depositToken(token.address, amount, {from: user1})

          // Withdraw tokens
          result = await exchange.withdrawToken(token.address, amount, {from: user1})
        })

        it('withdraws tokens', async () => {
          const balance = await exchange.tokens(token.address, user1)
          balance.toString().should.equal('0');
        })

        it('emits a Withdraw event', async () => {
          const log = result.logs[0]
          log.event.should.eq('Withdraw')
          const event = log.args
          event.token.toString().should.equal(token.address)
          event.user.should.equal(user1)
          event.amount.toString().should.equal(amount.toString())
          event.balance.toString().should.equal('0')
         })
      })

      describe('failure', async () => {
        it('rejects Ether withdrawls', async () => {
          await exchange.withdrawToken(ETHER_ADDRESS, tokens(100), {from: user1}).should.be.rejectedWith(EVM_REVERT)
        })
        // Reference Ln 160
        it('rejects withdrawls for insufficient balances', async () => {
          await exchange.withdrawToken(token.address, tokens(100), {from: user1}).should.be.rejectedWith(EVM_REVERT)
        })
      })
    })

    describe('checking balances', async () => {
      beforeEach(async () => {
        await exchange.depositEther({from: user1, value: ether(1)})
      })

      it('returns user balances', async () => {
        const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
        result.toString().should.equal(ether(1).toString())
      })
    })

    describe('making orders', async () => {
      let result 
      beforeEach(async () => {
        result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from: user1})
      })

      it('tracks the newly created order', async () => {
        const orderCount = await exchange.orderCount()
        orderCount.toString().should.equal('1')
        const order = await exchange.orders('1')
        // Verifies the rest of the attributes are correct within the Struct in the Exchange smart contract
        order.id.toString().should.equal('1', 'id is correct')
        order.user.should.equal(user1, 'user is correct')
        order.tokenGet.should.equal(token.address, 'tokenGet is correct')
        order.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
        order.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
        order.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
        order.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
      })

      it('emits an Order event', async () => {
        const log = result.logs[0]
          log.event.should.eq('Order')
          const event = log.args
          event.id.toString().should.equal('1', 'id is correct')
          event.user.should.equal(user1, 'user address is correct')
          event.tokenGet.should.equal(token.address, 'tokenGet is correct')
          event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
          event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
          event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
          event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
      })
    })

    describe('order actions', async () => {

      beforeEach(async () => {
        // user1 deposits ether
        await exchange.depositEther({from: user1, value: ether(1)})
        // user1 gives tokens to user2
        await token.transfer(user2, tokens(100), {from: deployer})
        // user2 deposits only
        await token.approve(exchange.address, tokens(2), {from: user2})
        await exchange.depositToken(token.address, tokens(2), {from: user2})
        // user1 makes an order to buy tokens with Ether
        await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from: user1})
      })

      describe('filling orders', async () => {
        let result

        describe('success', async () => {
          beforeEach(async () => {
            // user2 fills order
            result = await exchange.fillOrder('1', {from: user2})
          })

          it('executes the trade and charges fees', async () => {
            let balance
            balance = await exchange.balanceOf(token.address, user1)
            balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens')
            balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
            balance.toString().should.equal(ether(1).toString(), 'user2 received Ether')
            balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
            balance.toString().should.equal('0','user1 Ether deducted')
            balance = await exchange.balanceOf(token.address, user2)
            balance.toString().should.equal(tokens(0.9).toString(), 'user2 tokens deducted with fee applied')
            const feeAccount = await exchange.feeAccount()
            balance = await exchange.balanceOf(token.address, feeAccount)
            balance.toString().should.equal(tokens(0.1).toString(), 'fee account received fee')
          })

          it('updates filled orders', async () => {
            const orderFilled = await exchange.orderFilled(1)
            orderFilled.should.equal(true)
          })

          it('emits an Trade event', async () => {
            const log = result.logs[0]
              log.event.should.eq('Trade')
              const event = log.args
              event.id.toString().should.equal('1', 'id is correct')
              event.user.should.equal(user1, 'user address is correct')
              event.tokenGet.should.equal(token.address, 'tokenGet is correct')
              event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
              event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
              event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
              event.userFill.should.equal(user2, 'userFill is correct')
              event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
        })
      })

      describe('failure', async () => {
        
        it('rejects invalid order ids', async () => {
          const invalidOrder = 999999
          await exchange.fillOrder(invalidOrder, {from: user2}).should.be.rejectedWith(EVM_REVERT)
        })

        it('rejects already-filled orders', async () => {
          // Fill the order first
          await exchange.fillOrder('1', {from: user2}).should.be.fulfilled
          // Try to fill it again
          await exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
        })

        it('rejects cancelled orders', async () => {
          // Fill the order first
          await exchange.cancelOrder('1', {from: user1}).should.be.fulfilled
          // Try to fill it again
          await exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
        })
      })
    
      describe('cancelling orders', async() => {
        let result

        describe('success', async () => {
          beforeEach(async () => {
            result = await exchange.cancelOrder('1', {from: user1})
          })

          it('updates cancelled orders', async() => {
            const orderCancelled = await exchange.orderCancelled(1)
            orderCancelled.should.equal(true)
          })

          it('emits an Cancel event', async () => {
            const log = result.logs[0]
              log.event.should.eq('Cancel')
              const event = log.args
              event.id.toString().should.equal('1', 'id is correct')
              event.user.should.equal(user1, 'user address is correct')
              event.tokenGet.should.equal(token.address, 'tokenGet is correct')
              event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
              event.tokenGive.should.equal(ETHER_ADDRESS, 'tokenGive is correct')
              event.amountGive.toString().should.equal(ether(1).toString(), 'amountGive is correct')
              event.timestamp.toString().length.should.be.at.least(1, 'timestamp is present')
          })
        })

        describe('failure', async () => {
          it('rejects invalid order ids', async () => {
            const invalidOrderId = 9999
            await exchange.cancelOrder(invalidOrderId, {from: user1}).should.be.rejectedWith(EVM_REVERT)
          })

          it('rejects unathorized cancellations', async () => {
            // Try to cancel the order from another user
            await exchange.cancelOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
          })
        })
      })
    })
  })
})
