import React, { useState, useEffect } from "react";
import {
  BitcoinNetwork,
  BitcoinWallet,
  BitcoinProvider,
  EVMWallet,
} from "@catalogfi/wallets";
import {
  Orderbook,
  Chains,
  Assets,
  Actions,
  parseStatus,
  TESTNET_ORDERBOOK_API,
} from "@gardenfi/orderbook";
import { GardenJS } from "@gardenfi/core";
import { JsonRpcProvider, Wallet, ethers } from "ethers";
import { ERC20ABI } from "./erc20";
import Ripples from "react-ripples";

function App() {
  const [bitcoinWallet, setBitcoinWallet] = useState(null);
  const [evmWallet, setEvmWallet] = useState(null);
  const [signer, setSigner] = useState(null);
  const [bitcoinAddress, setBitcoinAddress] = useState("");
  const [bitcoinBalance, setBitcoinBalance] = useState(0);
  const [changeWalletStatus, setChangeWalletStatus] = useState({
    bitcoinWallet: false,
    evmWallet: false,
  });
  const [evmAddress, setEvmAddress] = useState("");
  const [evmBalance, setEvmBalance] = useState(0);
  const [reverseTransaction, setReverseTransaction] = useState(false);
  const [status, setStatus] = useState("");
  const [network, setNetwork] = useState("Testnet");
  const [privateKey, setPrivateKey] = useState("");
  const [donePrivateKey, setDonePrivateKey] = useState("");

  // const [orders, setOrders] = useState(new Map<number, OrderbookOrder>{});
  const pollingInterval = 5000;

  useEffect(() => {
    sepolia_balance(); // Initial call to the function
    const interval = setInterval(sepolia_balance, pollingInterval); // Set up polling
    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  const bitcoin_wallet = async (iddd) => {
    const bitcoin_Wallet = BitcoinWallet.fromWIF(
      iddd,
      new BitcoinProvider(BitcoinNetwork.Testnet)
    );
    const _balance = await bitcoin_Wallet.getBalance();
    console.log("Price --------------- " + _balance);
    setBitcoinBalance(_balance / 100000000);
    const _address = await bitcoin_Wallet.getAddress();
    console.log("daad -- " + typeof _address);
    setBitcoinAddress(_address);
    setBitcoinWallet(bitcoin_Wallet);
    console.log(bitcoin_Wallet);
    setChangeWalletStatus({ ...changeWalletStatus, bitcoinWallet: true });
  };

  // const ethereum_wallet = async () => {
  //   const si_gner = new Wallet(
  //     "",
  //     new JsonRpcProvider("https://rpc2.sepolia.org")
  //   );
  //   const evm_Wallet = new EVMWallet(si_gner);
  //   setEvmWallet(evm_Wallet);
  //   setSigner(si_gner);
  //   console.log("lllll === ", si_gner);
  //   // console.log(si_gner,evm_Wallet);
  // };
  const [oo, setOO] = useState(false);
  const ethereum__wallet = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const si_gner = await provider.getSigner();
    const evm_Wallet = new EVMWallet(si_gner);
    setEvmWallet(evm_Wallet);
    setSigner(si_gner);
    console.log(si_gner, JSON.stringify(evm_Wallet));
    const _address = await si_gner.getAddress();
    console.log(_address);
    setEvmAddress(_address);
    sepolia_balance();

    setChangeWalletStatus({ ...changeWalletStatus, evmWallet: true });
  };
  useEffect(() => {
    // Code here will run only once when the component is mounted
    sepolia_balance();
  }, [ethereum__wallet]); // Empty dependency array
  const order_book = async (ammo) => {
    setStatus("Pending.....");
    const orderbook = await Orderbook.init({
      url: TESTNET_ORDERBOOK_API, // add this line only for testnet
      signer,
    });
    console.log("orderbook : " + JSON.stringify(orderbook));

    const wallets = {
      [Chains.bitcoin_testnet]: bitcoinWallet,
      [Chains.ethereum_sepolia]: evmWallet,
    };

    console.log("wallets : " + JSON.stringify(wallets));

    const garden = new GardenJS(orderbook, wallets);

    console.log("garden : " + JSON.stringify(garden));

    const sendAmount = ammo * 1e8;
    const receiveAmount = (1 - 0.3 / 100) * sendAmount;

    var orderId = null;

    if (reverseTransaction == true) {
      orderId = await garden.swap(
        Assets.ethereum_sepolia.WBTC,
        Assets.bitcoin_testnet.BTC,
        sendAmount,
        receiveAmount
      );
    }
    if (reverseTransaction == false) {
      orderId = await garden.swap(
        Assets.bitcoin_testnet.BTC,
        Assets.ethereum_sepolia.WBTC,
        sendAmount,
        receiveAmount
      );
    }

    console.log("orderId : " + JSON.stringify(orderId));

    garden.subscribeOrders(await evmWallet.getAddress(), async (orders) => {
      const arr = [];
      arr.push(orders);
      [...new Set(arr)];
      console.log(
        "ko +++ " +
          JSON.stringify(orders) +
          "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
      );
      orders.map((val) => console.log("ID *********** = " + val.ID));
      const order = orders.filter((order) => order.ID === orderId)[0];
      console.log("OOOOrder === ", order);
      if (!order) return;

      const action = parseStatus(order);

      if (
        action === Actions.UserCanInitiate ||
        action === Actions.UserCanRedeem
      ) {
        const swapper = garden.getSwap(order);
        const swapOutput = await swapper.next();
        if (swapOutput.action.toLocaleLowerCase() == "redeem")
          setStatus("Successful");
        console.log(
          `Completed Action ${swapOutput.action} with transaction hash: ${swapOutput.output}`
        );
        console.log("THE END");
      }
      console.log("THE END ------------------- ");
    });

    console.log("END");
  };

  const [btcTOwbtc, setBtcTOwbtc] = useState(0);

  const handleInput = (event) => {
    // const name = event.target.name;
    const value = event.target.value;
    console.log(value);
    setBtcTOwbtc(value);
    // console.log(btcTOwbtc.name);
    // console.log(btcTOwbtc.category);
  };
  const handleInput2 = (event) => {
    // const name = event.target.name;
    const value = event.target.value;
    console.log(value);
    setPrivateKey(value);
  };
  const setBPrivateKey = () => {
    // const name = event.target.name;
    setDonePrivateKey(privateKey);
    console.log("awfawf : " + privateKey);
  };

  const reverse = () => {
    setReverseTransaction(!reverseTransaction);
  };

  const sepolia_balance = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      "0xaD9d14CA82d9BF97fFf745fFC7d48172A1c0969E",
      ERC20ABI,
      provider
    );
    const _balance = await contract.balanceOf(evmAddress);
    console.log("meow == " + Number(_balance) / 100000000);
    const bal = Number(_balance) / 100000000;
    setEvmBalance(bal);
    const _Bbalance = await bitcoinWallet.getBalance();
    console.log("Price --------------- " + _Bbalance);
    setBitcoinBalance(_Bbalance / 100000000);
  };

  const swittchNetwork = async (net) => {
    if (net == "Testnet") setNetwork("Localnet");
    if (net == "Localnet") setNetwork("Testnet");
  };

  return (
    <>
      {/* <button className='bg-orange-600 border-black border-2 rounded-lg' onClick={bitcoin_wallet}>Bitcoin Wallet</button>
     <button className='bg-orange-600 border-black border-2 rounded-lg' onClick={ethereum_wallet}>EVM Wallet</button>
     <button className='bg-orange-600 bordeyr-black border-2 rounded-lg' onClick={order_book}>Transaction</button> */}
      <div className="flex justify-center items-center mx-10 my-20">
        <h1 className="text-2xl underline">Swap Faucet</h1>
      </div>
      <div className="mx-36 flex flex-col gap-2">
        <div>
          <h1 className="text-xl">
            Enter Private key of your Bitcoin testnet for setup the connection
          </h1>
        </div>
        <div className="flex gap-4">
          <input
            type="password"
            autoComplete="off"
            value={privateKey}
            onChange={handleInput2}
            placeholder="BTC Testnet Private Key"
            className="border-black border-2 border-solid p-1 rounded-lg w-[500px] text-xl"
          />
          <Ripples color="black" during={1200} placeholder={"Random Anything"}>
            {" "}
            <button
              className="w-20 border-black border-2 border-solid rounded-lg p-1 text-xl"
              onClick={setBPrivateKey}
            >
              Set
            </button>
          </Ripples>
        </div>
      </div>
      <div className="flex justify-center gap-16  mx-10 my-8">
        <div className="border-black border-2 border-solid rounded-lg flex flex-col w-[700px] justify-center items-center gap-10 py-8">
          <div className="flex w-[600px] gap-6">
            <div className="flex flex-col  gap-4">
              {changeWalletStatus.bitcoinWallet == true ? (
                <p className="w-72 border-black border-2 border-solid rounded-lg	p-2 flex justify-center items-center text-xl font-medium">
                  Bitcoin Wallet Connected ✅
                </p>
              ) : (
                <Ripples
                  color="black"
                  during={1200}
                  placeholder={"Random Anything"}
                >
                  {" "}
                  <button
                    onClick={() => {
                      bitcoin_wallet(donePrivateKey);
                    }}
                    className="w-72 border-black border-2 border-solid rounded-lg	p-2 text-xl font-medium"
                  >
                    Bitcoin Wallet Connect
                  </button>
                </Ripples>
              )}
              {changeWalletStatus.evmWallet == true ? (
                <p className="w-80 border-black border-2 border-solid rounded-lg	p-2 flex justify-center items-center text-xl font-medium">
                  Ethereum Wallet Connected ✅
                </p>
              ) : (
                <Ripples
                  color="black"
                  during={1200}
                  placeholder={"Random Anything"}
                >
                  {" "}
                  <button
                    onClick={ethereum__wallet}
                    className="w-72 border-black border-2 border-solid rounded-lg	p-2 text-xl font-medium"
                  >
                    Ethereum Wallet Connect
                  </button>
                </Ripples>
              )}
            </div>
            <div>
              <p className="w-72 border-black border-2 border-solid rounded-lg	p-2 text-xl font-medium text-center">
                {network}🟢
              </p>
            </div>
          </div>

          <div className="flex flex-col border-2 border-black w-[600px] gap-6 px-10 py-6 rounded-lg">
            <label htmlFor="name" className="text-4xl font-medium">
              {reverseTransaction == true ? (
                <h1 className="flex gap-3">
                  WBTC
                  <img src="https://testnet.garden.finance/_next/static/media/wbtc.f5523e46.svg" />{" "}
                  -- TO --{">"} BTC
                  <img src="https://testnet.garden.finance/_next/static/media/btc.cb05590c.svg" />
                </h1>
              ) : (
                <h1 className="flex gap-3">
                  BTC
                  <img src="https://testnet.garden.finance/_next/static/media/btc.cb05590c.svg" />{" "}
                  -- TO --{">"} WBTC
                  <img src="https://testnet.garden.finance/_next/static/media/wbtc.f5523e46.svg" />
                </h1>
              )}
            </label>
            <input
              type="number"
              autoComplete="off"
              value={btcTOwbtc}
              onChange={handleInput}
              placeholder="BTC"
              className="border-black border-2 border-solid rounded-lg w-[500px] text-3xl"
            ></input>
          </div>

          <div className="w-[600px] border-black border-2 rounded-lg h-20 flex justify-center items-center">
            <Ripples
              color="black"
              during={1200}
              placeholder={"Random Anything"}
            >
              {" "}
              <button
                onClick={reverse}
                className="w-72 border-black border-2 border-solid rounded-lg	p-2 text-xl font-medium"
              >
                Reverse
              </button>
            </Ripples>
          </div>
          <Ripples color="black" during={1200} placeholder={"Random Anything"}>
            {" "}
            <button
              onClick={() => {
                order_book(btcTOwbtc);
              }}
              className="w-72 border-black border-2 border-solid rounded-lg	p-2 text-xl font-medium"
            >
              Initiate{" "}
            </button>
          </Ripples>
        </div>
        <div className="flex flex-col gap-10">
          <div className="w-[800px] h-[87px] border-2 border-black rounded-lg border-solid ">
            <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
              <tr>
                <th className="w-[140px] border px-4 py-2 border-gray-300 bg-gray-200">
                  Bitcoin Wallet
                </th>
                <td className="border px-4 py-2">{bitcoinAddress}</td>
                <th className="w-[92px] border px-4 py-2 border-gray-300 bg-gray-200">
                  Balance
                </th>
                <td className="border px-4 py-2">{bitcoinBalance}</td>
              </tr>
              <tr>
                <th className="w-[140px] border px-4 py-2 border-gray-300 bg-gray-200">
                  EVM Wallet
                </th>
                <td className="border px-4 py-2">{evmAddress}</td>
                <th className="w-[92px] border px-4 py-2 border-gray-300 bg-gray-200">
                  Balance
                </th>
                <td className="border px-4 py-2">{evmBalance}</td>
              </tr>
            </table>
          </div>
          <div>
            <h1 className="text-xl">
              Transaction {"(Status)"} -----{">"} {status}
            </h1>
          </div>
          <div>
            <div className="pl-96">
              <Ripples
                color="black"
                during={1200}
                placeholder={"Random Anything"}
              >
                {" "}
                <button
                  className="border-black border-2 border-solid rounded-lg	p-2 text-xl"
                  onClick={() => {
                    swittchNetwork(network);
                  }}
                >
                  🖙 Switch To {network == "Testnet" ? "Localnet" : "Testnet"}
                </button>
              </Ripples>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
