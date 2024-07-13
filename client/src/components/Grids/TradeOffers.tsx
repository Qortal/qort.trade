import React, { useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from 'axios';
import { sendRequestToExtension } from '../../App';
import { Button } from '@mui/material';

interface RowData {
  amountQORT: number;
  priceUSD: number;
  totalUSD: number;
  seller: string;
}

export const TradeOffers: React.FC = () => {
    const [offers, setOffers] = useState<any[]>([])
    const [selectedOffer, setSelectedOffer] = useState(null)
    const tradePresenceTxns = useRef(null)
    const offeringTrades = useRef<any[]>([])
    const blockedTradesList = useRef([])
  const columnDefs: ColDef[] = [
    { headerName: "Amount (QORT)", field: "qortAmount" },
    { headerName: "Price (LTC)", valueGetter: (params) => +params.data.foreignAmount / +params.data.qortAmount, sortable: true, sort: 'asc' },
    { headerName: "Total (LTC)", field: "foreignAmount",   },
    { headerName: "Seller", field: "qortalCreator" }
  ];

  const rowData: RowData[] = [
    { amountQORT: 100, priceUSD: 2, totalUSD: 200, seller: "Seller1" },
    { amountQORT: 50, priceUSD: 2.5, totalUSD: 125, seller: "Seller2" },
    // Add more rows as needed
  ];

  const onRowClicked = (event: any) => {
    setSelectedOffer(event.data)
    console.log("Row clicked: ", event.data);
    // Handle the row click callback with event.data
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
    }, [])
    localStorage.setItem("failedTrades", JSON.stringify(cleanBlockedTrades))
    blockedTradesList.current = JSON.parse(localStorage.getItem("failedTrades") || "[]")
  }

  await filterUnconfirmedTransactionsList()
}

const processOffersWithPresence = () => {
    if (offeringTrades.current === null) return
    console.log('offeringTrades.current', offeringTrades.current)
    async function asyncForEach(array: any, callback: any) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array)
        }
    }

    const filterOffersUsingTradePresence = (offeringTrade: any) => {
        return offeringTrade.tradePresenceExpiry > Date.now();
    }

    const startOfferPresenceMapping = async () => {
        console.log('tradePresenceTxns.current', tradePresenceTxns.current)
        if (tradePresenceTxns.current) {
            for (const tradePresence of tradePresenceTxns.current) {
              const offerIndex = offeringTrades.current.findIndex(offeringTrade => offeringTrade.qortalCreatorTradeAddress === tradePresence.tradeAddress);
              if (offerIndex !== -1) {
                offeringTrades.current[offerIndex].tradePresenceExpiry = tradePresence.timestamp;
              }
            }
          }
          
        console.log('second', offeringTrades.current)
        let filteredOffers = offeringTrades.current.filter((offeringTrade) => filterOffersUsingTradePresence(offeringTrade))
        console.log({filteredOffers})
        let tradesPresenceCleaned: any[] = filteredOffers

      
					
        blockedTradesList.current.forEach((item: any) => {
            const toDelete = item.recipient
            tradesPresenceCleaned = tradesPresenceCleaned.filter(el => {
                return el.qortalCreatorTradeAddress !== toDelete
            })
        })
					
        console.log({tradesPresenceCleaned})
        if(tradesPresenceCleaned){
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
    let socketLink = `ws://host4data.qortal.org:12391/websockets/crosschain/tradepresence`
    const socket = new WebSocket(socketLink)
    socket.onopen = () => {
        setTimeout(pingSocket, 50)
    }
    socket.onmessage = (e) => {
        console.log('data', JSON.parse(e.data))
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
    let socketLink = `ws://host4data.qortal.org:12391/websockets/crosschain/tradeoffers?foreignBlockchain=LITECOIN&includeHistoric=true`
    const socket = new WebSocket(socketLink)
    socket.onopen = () => {
        setTimeout(pingSocket, 50)
        tradeOffersSocketCounter += 1
    }
    socket.onmessage = (e) => {
        offeringTrades.current = [...offeringTrades.current, ...JSON.parse(e.data)]
        console.log('offers', JSON.parse(e.data))
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

useEffect(()=> {
  blockedTradesList.current = JSON.parse(localStorage.getItem('failedTrades') || '[]')
    initTradePresenceWebSocket()
    initTradeOffersWebSocket()
    getNewBlockedTrades()
    const intervalBlockTrades = setInterval(() => {
			getNewBlockedTrades()
		}, 150000)

    return ()=> {
      clearInterval(intervalBlockTrades)
    }
}, [])

const buyOrder = async ()=> {
  try {
    if(!selectedOffer) return
    console.log({selectedOffer})
    const response = await sendRequestToExtension(
      "REQUEST_BUY_ORDER",
      {
        qortalAtAddress: selectedOffer?.qortalAtAddress
      },
      60000
    );
  } catch (error) {
    
  }
}
  console.log({offers})
  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={offers}
        onRowClicked={onRowClicked}
        rowSelection="single"
      />
      {selectedOffer && (
              <Button onClick={buyOrder}>Buy</Button>

      )}
    </div>
  );
};

