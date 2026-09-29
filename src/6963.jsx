
import { useEffect, useState } from "react";

const SUPPORTED_CHAINS = {
  11155111: {
    name: "Sepolia",
    chainId: "0xaa36a7",
  },
  1: {
    name: "Ethereum Mainnet",
    chainId: "0x1",
  },
};

const Eip6963 = () => {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);

  const [error, setError] = useState("");
  const [showSwitchPrompt, setShowSwitchPrompt] = useState(false);

  useEffect(() => {
    const handleProvider = (event) => {
      const provider = event.detail;

      console.log("Provider:", provider);

      setProviders((currentProviders) => {
        const alreadyExists = currentProviders.some(
          (item) =>
            item.info.uuid === provider.info.uuid
        );

        if (alreadyExists) {
          return currentProviders;
        }

        return [...currentProviders, provider];
      });
    };

    window.addEventListener(
      "eip6963:announceProvider",
      handleProvider
    );

    // Ask wallets to announce themselves
    const requestEvent = new Event("eip6963:requestProvider");
    window.dispatchEvent(requestEvent);

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleProvider
      );
    };
  }, []);

  const handleAccountChange = (accounts) => {
    if (accounts.length === 0) {
      setAccount("");
      setChainId(null);
      setSelectedProvider(null);
      setShowSwitchPrompt(false);
      setError("");
      return;
    }

    setAccount(accounts[0]);
  };

  const handleChainChange = (newChainId) => {
    const numericChainId = parseInt(newChainId, 16);

    setChainId(numericChainId);

    if (!SUPPORTED_CHAINS[numericChainId]) {
      setError(
        `Unsupported chain detected: ${newChainId}`
      );

      setShowSwitchPrompt(true);
    } else {
      setError("");
      setShowSwitchPrompt(false);
    }
  };

  const handleConnectWallet = async (walletProvider) => {
    try {
      setError("");

      const accounts = await walletProvider.request({
        method: "eth_requestAccounts",
      });

      const currentChainId = await walletProvider.request({
        method: "eth_chainId",
      });

      setSelectedProvider(walletProvider);

      setAccount(accounts[0]);

      handleChainChange(currentChainId);

      // Listen for account changes
      walletProvider.on("accountsChanged", handleAccountChange);

      // Listen for chain changes
      walletProvider.on("chainChanged", handleChainChange);
    } catch (error) {
      console.error(error);

      setError(error.message || "Failed to connect wallet");
    }
  };

  const handleDisconnect = () => {
    // EIP-1193 does not define a universal disconnect method.
    // So we clear the application's connection state.

    if (selectedProvider) {
      selectedProvider.removeListener(
        "accountsChanged",
        handleAccountChange
      );

      selectedProvider.removeListener(
        "chainChanged",
        handleChainChange
      );
    }

    setSelectedProvider(null);
    setAccount("");
    setChainId(null);
    setError("");
    setShowSwitchPrompt(false);
  };

  const switchToSupportedChain = async () => {
    if (!selectedProvider) return;

    // Use Sepolia as the default supported chain
    const targetChain = SUPPORTED_CHAINS[11155111];

    try {
      await selectedProvider.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: targetChain.chainId,
          },
        ],
      });

      setError("");
      setShowSwitchPrompt(false);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to switch to a supported chain."
      );
    }
  };

  return (
    <div>
      <h1>EIP-6963 Wallets</h1>

      <h2>Supported Chains</h2>

      <ul>
        {Object.entries(SUPPORTED_CHAINS).map(
          ([id, chain]) => (
            <li key={id}>
              {chain.name} - Chain ID: {id}
            </li>
          )
        )}
      </ul>

      <h2>Available Wallets</h2>

      {providers.map((provider) => (
        <div
          key={provider.info.uuid}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <img
            src={provider.info.icon}
            alt={provider.info.name}
            width={50}
            height={50}
          />

          <p>{provider.info.name}</p>

          <button
            onClick={() =>
              handleConnectWallet(provider.provider)
            }
          >
            Connect {provider.info.name}
          </button>
        </div>
      ))}

      {account && (
        <div style={{ marginTop: "30px" }}>
          <h2>Wallet Connected</h2>

          <p>
            <strong>Account:</strong>{" "}
            {account}
          </p>

          <p>
            <strong>Chain ID:</strong>{" "}
            {chainId}
          </p>

          <p>
            <strong>Chain:</strong>{" "}
            {SUPPORTED_CHAINS[chainId]
              ? SUPPORTED_CHAINS[chainId].name
              : "Unsupported Chain"}
          </p>

          <button onClick={handleDisconnect}>
            Disconnect
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
        </div>
      )}

      {showSwitchPrompt && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid orange",
          }}
        >
          <p>
            Your wallet is connected to an unsupported
            network.
          </p>

          <p>
            Please switch to a supported network.
          </p>

          <button onClick={switchToSupportedChain}>
            Switch to Sepolia
          </button>
        </div>
      )}
    </div>
  );
};

export default Eip6963;
