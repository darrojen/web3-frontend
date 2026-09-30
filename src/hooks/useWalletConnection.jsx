import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, formatEther } from "ethers";
import {
  EIP6963AnnounceProvider,
  EIP6963RequestProvider,
  SUPPORTED_CHAINS,
} from "../constants";

export const useWalletConnection = () => {
  const [account, setAccount] = useState("");
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [browserProvider, setBrowserProvider] = useState(null);
  const [provider, setProvider] = useState(null);

  const [error, setError] = useState("");
  const [unsupportedChain, setUnsupportedChain] = useState(null);

  const isSupportedChain = useCallback((chainId) => {
    return SUPPORTED_CHAINS.some((chain) => chain.chainId === chainId);
  }, []);

  const setAccountAndSigner = useCallback(
    async (accounts) => {
      if (!browserProvider) return;

      if (accounts.length > 0) {
        const newAccount = accounts[0];

        setAccount(newAccount);

        const newSigner = await browserProvider.getSigner(newAccount);
        setSigner(newSigner);
      } else {
        setAccount("");
        setSigner(null);
        setBalance(null);
      }
    },
    [browserProvider]
  );

  const checkChain = useCallback(
    (newChainId) => {
      const numericChainId =
        typeof newChainId === "string"
          ? parseInt(newChainId, 16)
          : Number(newChainId);

      setChainId(numericChainId);

      if (!isSupportedChain(numericChainId)) {
        const chain = SUPPORTED_CHAINS.find(
          (chain) => chain.chainId === numericChainId
        );

        setUnsupportedChain({
          chainId: numericChainId,
          name: chain?.name || `Chain ${numericChainId}`,
        });

        setError(
          `Unsupported chain detected: ${numericChainId}. Please switch to a supported chain.`
        );
      } else {
        setUnsupportedChain(null);
        setError("");
      }

      setBalance(null);
    },
    [isSupportedChain]
  );

  const connectWallet = useCallback(async () => {
    if (!browserProvider) {
      throw new Error("No wallet provider detected.");
    }

    try {
      setError("");

      const accounts = await browserProvider.send(
        "eth_requestAccounts",
        []
      );

      await setAccountAndSigner(accounts);

      const network = await browserProvider.getNetwork();

      checkChain(Number(network.chainId));
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to connect wallet.");
    }
  }, [browserProvider, setAccountAndSigner, checkChain]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (provider) {
        try {
          await provider.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch (error) {
          console.log(
            "Wallet does not support permission revocation:",
            error
          );
        }
      }
    } finally {
      setAccount("");
      setSigner(null);
      setChainId(null);
      setBalance(null);
      setError("");
      setUnsupportedChain(null);
    }
  }, [provider]);

  const handleAccountsChanged = useCallback(
    async (accounts) => {
      console.log("Accounts changed:", accounts);

      await setAccountAndSigner(accounts);

      if (accounts.length === 0) {
        setChainId(null);
        setBalance(null);
      }
    },
    [setAccountAndSigner]
  );

  const handleChainChanged = useCallback(
    (newChainId) => {
      console.log("Chain changed:", newChainId);

      checkChain(newChainId);
    },
    [checkChain]
  );

  const handleDisconnect = useCallback(
    async (error) => {
      console.error("Wallet disconnected:", error);

      await disconnectWallet();
    },
    [disconnectWallet]
  );

  const getBalance = useCallback(async () => {
    if (!browserProvider || !account) {
      return;
    }

    try {
      const balance = await browserProvider.getBalance(account);

      setBalance(formatEther(balance));
    } catch (error) {
      console.error("Failed to get balance:", error);
      setError("Failed to fetch wallet balance.");
    }
  }, [browserProvider, account]);

  const switchToSupportedChain = useCallback(async () => {
    if (!provider) return;

    const targetChain = SUPPORTED_CHAINS[0];

    try {
      setError("");

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: targetChain.hex,
          },
        ],
      });

      setUnsupportedChain(null);
    } catch (error) {
      console.error("Failed to switch chain:", error);

      setError(
        error.message || "Failed to switch to a supported chain."
      );
    }
  }, [provider]);

  // Initialize wallet provider
  useEffect(() => {
    const handleProviderAnnouncement = (event) => {
      if (event.detail.info.rdns === "io.metamask") {
        const injectedProvider = event.detail.provider;

        setProvider(injectedProvider);
        setBrowserProvider(new BrowserProvider(injectedProvider));
      }
    };

    window.addEventListener(
      EIP6963AnnounceProvider,
      handleProviderAnnouncement
    );

    window.dispatchEvent(new Event(EIP6963RequestProvider));

    return () => {
      window.removeEventListener(
        EIP6963AnnounceProvider,
        handleProviderAnnouncement
      );
    };
  }, []);

  // Check existing connection
  useEffect(() => {
    if (!browserProvider) return;

    const init = async () => {
      try {
        const accounts = await browserProvider.send(
          "eth_accounts",
          []
        );

        if (accounts.length === 0) {
          return;
        }

        await setAccountAndSigner(accounts);

        const network = await browserProvider.getNetwork();

        checkChain(Number(network.chainId));
      } catch (error) {
        console.error("Failed to initialize wallet:", error);
      }
    };

    init();
  }, [browserProvider, setAccountAndSigner, checkChain]);

  // Listen for EIP-1193 events
  useEffect(() => {
    if (!provider) return;

    provider.on("chainChanged", handleChainChanged);
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("disconnect", handleDisconnect);

    return () => {
      provider.removeListener("chainChanged", handleChainChanged);
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("disconnect", handleDisconnect);
    };
  }, [
    provider,
    handleChainChanged,
    handleAccountsChanged,
    handleDisconnect,
  ]);

  // Automatically fetch balance after account/provider changes
  useEffect(() => {
    if (!account || !browserProvider) {
      return;
    }

    getBalance();
  }, [account, browserProvider, getBalance]);

  return {
    account,
    provider,
    browserProvider,
    signer,
    balance,
    chainId,
    error,
    unsupportedChain,
    connectWallet,
    disconnectWallet,
    getBalance,
    switchToSupportedChain,
  };
};