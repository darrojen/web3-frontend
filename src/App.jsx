import EIP6963 from './6963';
import './App.css'
import { useState, useEffect } from 'react'


function App() {

      const [account, setAccount] = useState();
      const [chainId, setChainId] = useState();

    // Initialize your app state or any other setup logic here
    async function setUp() {
      
      const account = await window.ethereum.request({ method: "eth_accounts" });
      setAccount(account[0]);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(parseInt(chainId, 16));

      window.ethereum.on("connect", () => {
        console.log("Connected to MetaMask");
      });

      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
        console.log("Accounts changed:", accounts);
      });

      window.ethereum.on("chainChanged", (chainId) => {
        setChainId(parseInt(chainId, 16));
        console.log("Chain changed:", chainId);
      });

      console.log(account);
      console.log(chainId);
  }
useEffect(() => {
    setUp();
  }, []);

  return (
    <>  
            <EIP6963 />
    </>
  )
}

export default App