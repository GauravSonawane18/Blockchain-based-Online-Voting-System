import { useState } from "react";
import { ethers } from "ethers";
import { contractAddress, contractABI } from "./contract";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed!");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setAccount(accounts[0]);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const votingContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    setContract(votingContract);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Blockchain Voting System</h1>

      {!account ? (
        <button onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <>
          <p>Connected: {account}</p>
          <p>Contract Ready ✅</p>
        </>
      )}
    </div>
  );
}

export default App;
