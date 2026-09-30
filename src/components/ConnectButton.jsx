import { useWalletConnection } from "../hooks/useWalletConnection";

const ConnectButton = ({
  account,
  connectWallet,
  disconnectWallet,
}) => {
  return (
    <>
      {account ? (
        <button onClick={disconnectWallet}>
          Disconnect
        </button>
      ) : (
        <button onClick={connectWallet}>
          Connect
        </button>
      )}
    </>
  );
};

export default ConnectButton;