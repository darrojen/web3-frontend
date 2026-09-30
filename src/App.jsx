import ConnectButton from "./components/ConnectButton";
import { useWalletConnection } from "./hooks/useWalletConnection";
import { SUPPORTED_CHAINS } from "./constants";

function App() {
  const {
    account,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    getBalance,
    error,
    unsupportedChain,
    switchToSupportedChain,
  } = useWalletConnection();

  const currentChain = SUPPORTED_CHAINS.find(
    (chain) => chain.chainId === chainId
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1>EIP-1193 Wallet</h1>

      <ConnectButton
        account={account}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />

      <hr />

      {account && (
        <div>
          <h2>Wallet Information</h2>

          <p>
            <strong>Account:</strong> {account}
          </p>

          <p>
            <strong>Chain ID:</strong> {chainId}
          </p>

          <p>
            <strong>Network:</strong>{" "}
            {currentChain?.name || "Unsupported Network"}
          </p>

          {balance !== null && (
            <p>
              <strong>Balance:</strong> {balance} ETH
            </p>
          )}

          <button onClick={getBalance}>
            Refresh Balance
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid red",
          }}
        >
          <p>
            <strong>Error:</strong> {error}
          </p>

          {unsupportedChain && (
            <div>
              <p>
                Your wallet is connected to an unsupported
                chain.
              </p>

              <p>
                Please switch back to a supported chain.
              </p>

              <button onClick={switchToSupportedChain}>
                Switch to {SUPPORTED_CHAINS[0].name}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <h2>Supported Chains</h2>

        {SUPPORTED_CHAINS.map((chain) => (
          <div key={chain.chainId}>
            <p>
              {chain.name} — Chain ID: {chain.chainId}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;