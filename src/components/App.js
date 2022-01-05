import React, { Component } from 'react'
import './App.css'
import Navbar from './Navbar'
import Content from './Content'
import { connect } from 'react-redux'
import { 
  loadWeb3,
  loadAccount, 
  loadToken, 
  loadExchange
} from '../store/interactions'
import { contractsLoadedSelector } from '../store/selectors'



class App extends Component {
    componentWillMount() {
      this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    const web3 = await loadWeb3(dispatch)
    // Check network
    await web3.eth.net.getNetworkType()
    // Check networkId
    const networkId = await web3.eth.net.getId()
    // Check accounts
    await loadAccount(web3, dispatch)
    // All info needed to build smart contract
    // console.log("abi", Token.abi)
    // console.log("address", Token.networks[networkId].address)
    const token = await loadToken(web3, networkId, dispatch)
    if(!token) {
      window.alert('Token smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }
    // console.log("accounts", accounts)
    const exchange = await loadExchange(web3, networkId, dispatch)
    if(!exchange) {
      window.alert('Exchange smart contract not detected on the current network. Please select another network with Metamask.')
      return
  }
}

  render() {
    return (
      <div>
        <Navbar />
        { this.props.contractsLoaded ? <Content /> : <div className = "content"></div>}
      </div>
    );
  }
}

function mapStateToProps(state) {
  console.log("contractsLoaded", contractsLoadedSelector(state))
  return {
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App);