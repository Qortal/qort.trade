import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowClassParams, RowStyle } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from 'axios';
import { sendRequestToExtension, serverUrl } from '../../App';
import { Button } from '@mui/material';
import { nodeUrl } from '../../constants';
import gameContext from '../../contexts/gameContext';

interface RowData {
  amountQORT: number;
  priceUSD: number;
  totalUSD: number;
  seller: string;
}

export const TradeOffers: React.FC = () => {
  const [offers, setOffers] = useState<any[]>([])
  const [ltcBalance, setLTCBalance] = useState<number | null>(null)
  const { fetchOngoingTransactions, onGoingTrades } = useContext(gameContext);

  const listOfOngoingTradesAts = useMemo(()=> {
      return onGoingTrades?.filter((item)=> item?.status !== 'trade-failed').map((trade)=> trade.qortalAtAddress) || []
  }, [onGoingTrades])
  
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const tradePresenceTxns = useRef<any[]>([])
  const offeringTrades = useRef<any[]>([])
  const blockedTradesList = useRef([])

  const columnDefs: ColDef[] = [
    { headerName: "Amount (QORT)", field: "qortAmount" },
    { headerName: "Price (LTC)", valueGetter: (params) => +params.data.foreignAmount / +params.data.qortAmount, sortable: true, sort: 'asc' },
    { headerName: "Total (LTC)", field: "foreignAmount", },
    { headerName: "Seller", field: "qortalCreator" }
  ];

 

  const onRowClicked = (event: any) => {
    if(listOfOngoingTradesAts.includes(event.data.qortalAtAddress)) return
    setSelectedOffer(event.data)

  };

  const restartTradePresenceWebSocket = () => {
    setTimeout(() => initTradePresenceWebSocket(true), 50)
  }



  const getNewBlockedTrades = async () => {
    const unconfirmedTransactionsList = async () => {

      const unconfirmedTransactionslUrl = `https://api.qortal.org/transactions/unconfirmed?txType=MESSAGE&limit=0&reverse=true`

      var addBlockedTrades = JSON.parse(localStorage.getItem('failedTrades') || '[]')

      await fetch(unconfirmedTransactionslUrl).then(response => {
        return response.json()
      }).then(data => {
        data.map((item: any) => {
          const unconfirmedNessageTimeDiff = Date.now() - item.timestamp
          const timeOneHour = 60 * 60 * 1000
          if (Number(unconfirmedNessageTimeDiff) > Number(timeOneHour)) {
            const addBlocked = {
              timestamp: item.timestamp,
              recipient: item.recipient
            }
            addBlockedTrades.push(addBlocked)
          }
        })
        localStorage.setItem("failedTrades", JSON.stringify(addBlockedTrades))
        blockedTradesList.current = JSON.parse(localStorage.getItem('failedTrades') || '[]')
      })
    }

    await unconfirmedTransactionsList()

    const filterUnconfirmedTransactionsList = async () => {
      let cleanBlockedTrades = blockedTradesList.current.reduce((newArray, cut: any) => {
        if (cut && !newArray.some((obj: any) => obj.recipient === cut.recipient)) {
          newArray.push(cut)
        }
        return newArray
      }, [] as any[])
      localStorage.setItem("failedTrades", JSON.stringify(cleanBlockedTrades))
      blockedTradesList.current = JSON.parse(localStorage.getItem("failedTrades") || "[]")
    }

    await filterUnconfirmedTransactionsList()
  }

  const processOffersWithPresence = () => {
    if (offeringTrades.current === null) return
    async function asyncForEach(array: any, callback: any) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
      }
    }

    const filterOffersUsingTradePresence = (offeringTrade: any) => {
      return offeringTrade.tradePresenceExpiry > Date.now();
    }

    const startOfferPresenceMapping = async () => {
      if (tradePresenceTxns.current) {
        for (const tradePresence of tradePresenceTxns.current) {
          const offerIndex = offeringTrades.current.findIndex(offeringTrade => offeringTrade.qortalCreatorTradeAddress === tradePresence.tradeAddress);
          if (offerIndex !== -1) {
            offeringTrades.current[offerIndex].tradePresenceExpiry = tradePresence.timestamp;
          }
        }
      }

      let filteredOffers = offeringTrades.current.filter((offeringTrade) => filterOffersUsingTradePresence(offeringTrade))
      let tradesPresenceCleaned: any[] = filteredOffers



      blockedTradesList.current.forEach((item: any) => {
        const toDelete = item.recipient
        tradesPresenceCleaned = tradesPresenceCleaned.filter(el => {
          return el.qortalCreatorTradeAddress !== toDelete
        })
      })

      if (tradesPresenceCleaned) {
        setOffers(tradesPresenceCleaned)
      }
      // self.postMessage({ type: 'PRESENCE', data: { offers: offeringTrades.current, filteredOffers: filteredOffers, relatedCoin: _relatedCoin } })
    }

    startOfferPresenceMapping()
  }

  const restartTradeOffersWebSocket = () => {
    setTimeout(() => initTradeOffersWebSocket(true), 50)
  }

  const initTradePresenceWebSocket = (restarted = false) => {
    let socketTimeout: any
    let socketLink = `wss://appnode.qortal.org/websockets/crosschain/tradepresence`
    const socket = new WebSocket(socketLink)
    socket.onopen = () => {
      setTimeout(pingSocket, 50)
    }
    socket.onmessage = (e) => {
      tradePresenceTxns.current = JSON.parse(e.data)
      processOffersWithPresence()
      restarted = false
    }
    socket.onclose = () => {
      clearTimeout(socketTimeout)
      restartTradePresenceWebSocket()
    }
    socket.onerror = (e) => {
      clearTimeout(socketTimeout)
    }
    const pingSocket = () => {
      socket.send('ping')
      socketTimeout = setTimeout(pingSocket, 295000)
    }
  }

  const initTradeOffersWebSocket = (restarted = false) => {
    let tradeOffersSocketCounter = 0
    let socketTimeout: any
    let socketLink = `wss://appnode.qortal.org/websockets/crosschain/tradeoffers?foreignBlockchain=LITECOIN&includeHistoric=true`
    const socket = new WebSocket(socketLink)
    socket.onopen = () => {
      setTimeout(pingSocket, 50)
      tradeOffersSocketCounter += 1
    }
    socket.onmessage = (e) => {
      offeringTrades.current = [...offeringTrades.current, ...JSON.parse(e.data)]
      tradeOffersSocketCounter += 1
      restarted = false
      processOffersWithPresence()
    }
    socket.onclose = () => {
      clearTimeout(socketTimeout)
      restartTradeOffersWebSocket()
    }
    socket.onerror = (e) => {
      clearTimeout(socketTimeout)
    }
    const pingSocket = () => {
      socket.send('ping')
      socketTimeout = setTimeout(pingSocket, 295000)
    }
  }

  //   const fetchTradeOffers = async () => {
  //     try {
  //       const response = await axios.get('https://api.qortal.org/crosschain/tradeoffers?foreignBlockchain=LITECOIN&reverse=true&limit=100');
  //       setOffers(response.data);
  //     } catch (error) {
  //       console.error('Error fetching trade offers:', error);
  //     }
  //   };

  //   useEffect(() => {
  //     // Fetch trade offers immediately
  //     fetchTradeOffers();

  //     // Set up interval to fetch trade offers every 30 seconds
  //     const interval = setInterval(() => {
  //       fetchTradeOffers();
  //     }, 30000); // 30000 milliseconds = 30 seconds

  //     // Clean up the interval on component unmount
  //     return () => clearInterval(interval);
  //   }, []);

  useEffect(() => {
    blockedTradesList.current = JSON.parse(localStorage.getItem('failedTrades') || '[]')
    initTradePresenceWebSocket()
    initTradeOffersWebSocket()
    getNewBlockedTrades()
    const intervalBlockTrades = setInterval(() => {
      getNewBlockedTrades()
    }, 150000)

    return () => {
      clearInterval(intervalBlockTrades)
    }
  }, [])

  useEffect(() => {

    const intervalBlockTrades = setInterval(() => {
      getNewBlockedTrades()
    }, 150000)

    return () => {
      clearInterval(intervalBlockTrades)
    }
  }, [])



  const getLTCBalance = async () => {
    try {

      const response = await sendRequestToExtension(
        "REQUEST_LTC_BALANCE"
      );
      
      if(!response.error){
        return response
      }
    } catch (error) {

    }
  }

  const buyOrder = async () => {
    try {
      if (!selectedOffer) return
      if(!selectedOffer?.qortalAtAddress) return
      const checkIfOfferingRes = await axios.get(
        `${nodeUrl}/crosschain/trade/${selectedOffer?.qortalAtAddress}`
      );
      const data = checkIfOfferingRes.data
      if (data?.mode !== 'OFFERING') return // ADD NOTIFICATION


      
      if (!selectedOffer?.foreignAmount
      ) return

      const response = await sendRequestToExtension(
        "REQUEST_BUY_ORDER",
        {
          qortalAtAddress: selectedOffer?.qortalAtAddress
        },
        60000
      );
      if (response?.atAddress) {
        setSelectedOffer(null)
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `${serverUrl}/api/transaction/updatetx`,
          {
            qortalAtAddress: response?.atAddress, qortAddress: response?.qortAddress, node: response.node, status: "message-sent"
          },
          {
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
          }
        );

        fetchOngoingTransactions()
      }

    } catch (error) {

    }
  }


 
  const getRowStyle = (params: RowClassParams<any, any>): RowStyle | undefined => {
    if (listOfOngoingTradesAts.includes(params.data.qortalAtAddress)) {
      return { background: '#ff7373' };
    }
    if (params.data.qortalAtAddress === selectedOffer?.qortalAtAddress) {
      return { background: 'lightblue' };
    }
    return undefined;
  };
  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={offers}
        onRowClicked={onRowClicked}
        rowSelection="single"
        getRowStyle={getRowStyle}

      />
      {selectedOffer && (
        <Button onClick={buyOrder}>Buy</Button>

      )}
    </div>
  );
};

