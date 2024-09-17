import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowClassParams, RowStyle, SizeColumnsToContentStrategy } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from 'axios';
import { sendRequestToExtension, serverUrl } from '../../App';
import { Alert, Box, Button, Snackbar, SnackbarCloseReason, Typography } from '@mui/material';
import gameContext from '../../contexts/gameContext';
import { subscribeToEvent, unsubscribeFromEvent } from '../../utils/events';
import { getMainEndpoint } from '../../utils/findUsableApi';
// fix
interface RowData {
  amountQORT: number;
  priceUSD: number;
  totalUSD: number;
  seller: string;
}

const autoSizeStrategy: SizeColumnsToContentStrategy = {
  type: 'fitCellContents'
};

export const TradeOffers: React.FC = ({ltcBalance}) => {
  const [offers, setOffers] = useState<any[]>([])
  
  const { fetchOngoingTransactions, onGoingTrades } = useContext(gameContext);
  const listOfOngoingTradesAts = useMemo(()=> {
      return onGoingTrades?.filter((item)=> item?.status !== 'trade-failed')?.map((trade)=> trade?.qortalAtAddress) || []
  }, [onGoingTrades])

  const offersWithoutOngoing = useMemo(()=> {
    return offers.filter((item)=> !listOfOngoingTradesAts.includes(item.qortalAtAddress))
  }, [listOfOngoingTradesAts, offers])

 
  
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [selectedOffers, setSelectedOffers] = useState<any>([])

  const tradePresenceTxns = useRef<any[]>([])
  const offeringTrades = useRef<any[]>([])
  const blockedTradesList = useRef([])
  const gridRef = useRef<any>(null)
 
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState(null)
  const BuyButton = () => {
    return (
      <button onClick={buyOrder} style={{borderRadius: '8px', width: '74px', height:"30px", background: "#4D7345",
         color: 'white',  cursor: 'pointer', border: '1px solid #375232', boxShadow: '0px 2.77px 2.21px 0px #00000005'
          }}>
        BUY
      </button>
    );
  };
 

  const columnDefs: ColDef[] = [
    { 
      headerCheckboxSelection: true, // Adds a checkbox in the header for selecting all rows
      checkboxSelection: true, // Adds checkboxes in each row for selection
      headerName: "Select", // You can customize the header name
      width: 50, // Adjust the width as needed
      pinned: 'left', // Optional, to pin this column on the left
      resizable: false,
    },
    { headerName: "Amount (QORT)", field: "qortAmount" , flex: 1, // Flex makes this column responsive
    minWidth: 100, // Ensure it doesn't shrink too much
    resizable: true },
    { headerName: "LTC/QORT", valueGetter: (params) => +params.data.foreignAmount / +params.data.qortAmount, sortable: true, sort: 'asc', flex: 1, // Flex makes this column responsive
    minWidth: 100, // Ensure it doesn't shrink too much
    resizable: true  },
    { headerName: "Total LTC Value", field: "foreignAmount", flex: 1, // Flex makes this column responsive
    minWidth: 100, // Ensure it doesn't shrink too much
    resizable: true },
    { headerName: "Seller", field: "qortalCreator", flex: 1, // Flex makes this column responsive
    minWidth: 100, // Ensure it doesn't shrink too much
    resizable: true },
  ];

 

  // const onRowClicked = (event: any) => {
  //   if(listOfOngoingTradesAts.includes(event.data.qortalAtAddress)) return
  //   setSelectedOffer(event.data)

  // };

  const restartTradePresenceWebSocket = () => {
    setTimeout(() => initTradePresenceWebSocket(true), 50)
  }



  const getNewBlockedTrades = async () => {
    const unconfirmedTransactionsList = async () => {

      const unconfirmedTransactionslUrl = `${getMainEndpoint()}/transactions/unconfirmed?txType=MESSAGE&limit=0&reverse=true`

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
    processOffersWithPresence()
  }

  const executeGetNewBlockTrades = useCallback(()=> {
    getNewBlockedTrades()
   
  }, [])

  useEffect(() => {
    subscribeToEvent("execute-get-new-block-trades", executeGetNewBlockTrades);

    return () => {
      unsubscribeFromEvent("execute-get-new-block-trades", executeGetNewBlockTrades);
    };
  }, []);

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

      let filteredOffers = offeringTrades.current?.filter((offeringTrade) => filterOffersUsingTradePresence(offeringTrade)) || []
      let tradesPresenceCleaned: any[] = filteredOffers



      blockedTradesList.current.forEach((item: any) => {
        const toDelete = item.recipient
        tradesPresenceCleaned = tradesPresenceCleaned?.filter(el => {
          return el.qortalCreatorTradeAddress !== toDelete
        }) || []
      })

      if (tradesPresenceCleaned) {
        // setOffers(tradesPresenceCleaned)
        updateGridData(tradesPresenceCleaned)
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



  const selectedTotalLTC = useMemo(() => {
    return selectedOffers.reduce((acc, curr) => {
      return acc + (+curr.foreignAmount || 0); // Ensure qortAmount is defined
    }, 0);
  }, [selectedOffers]);


  const buyOrder = async () => {
    try {
      if(+ltcBalance < +selectedTotalLTC.toFixed(4)){
        setOpen(true)
        setInfo({
          type: 'error',
          message: "You don't have enough QORT or your balance was not retrieved"
        })
        return
      }
      
      if (selectedOffers?.length <  1) return
      //TODO
      // const checkIfOfferingRes = await axios.get(
      //   `${getMainEndpoint()}/crosschain/trade/${selectedOffer?.qortalAtAddress}`
      // );
      // const data = checkIfOfferingRes.data
      // if (data?.mode !== 'OFFERING') return // ADD NOTIFICATION


      
      // if (!selectedOffer?.foreignAmount
      // ) return
      const listOfATs = selectedOffers.map((offer)=> offer.qortalAtAddress)
      const endpoint = getMainEndpoint()
      const useLocal = endpoint === 'http://127.0.0.1:12391'
      const response = await sendRequestToExtension(
        "REQUEST_BUY_ORDER",
        {
          qortalAtAddresses: listOfATs,
          useLocal
        },
        60000
      );
      if (response?.atAddresses) {
        setSelectedOffers([])
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `${serverUrl}/api/transaction/updatetx`,
          {
            qortalAtAddresses: response?.atAddresses, qortAddress: response?.qortAddress, node: response.node, status: "message-sent", encryptedMessageToBase58: response?.encryptedMessageToBase58, chatSignature: response?.chatSignature, sender: response?.sender, senderPublicKey: response?.senderPublicKey, reference: response?.reference
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
      return { background: '#D9D9D91A'};
    }
    if (params.data.qortalAtAddress === selectedOffer?.qortalAtAddress) {
      return { background: '#6D94F533'};
    }
    return undefined;
  };
  // const onGridReady = (params) => {
  //   const allColumnIds = params.columnApi.getAllColumns().map(col => col.getColId());
  //   params.columnApi.autoSizeColumns(allColumnIds, false);
  // };

  const onSelectionChanged = (event: any) => {
    const selectedRows = event.api.getSelectedRows();
    
    setSelectedOffers([...selectedRows]); // Set all selected rows
  };
  
  const onRowClicked = (event: any) => {
    if (listOfOngoingTradesAts.includes(event.data.qortalAtAddress)) return;
    const selectedRows = gridRef.current?.api.getSelectedRows();
    setSelectedOffers([...selectedRows]); // Always spread the array to ensure state updates correctly
  };

  const updateGridData = (newData: any) => {
    if (gridRef.current) {
      const scrollPosition = gridRef.current.api.getVerticalScrollPosition();
      gridRef.current.api.setSuppressRowDrag(true);
      gridRef.current.api.setSuppressScrollOnNewData(true);
      setOffers(newData);
      setTimeout(() => {
        gridRef.current.api.refreshCells();
        gridRef.current.api.setSuppressRowDrag(false);
        gridRef.current.api.setSuppressScrollOnNewData(false);
      }, 0);
    }
  };

  const getRowId = useCallback(function (params: any) {
    return String(params.data.qortalAtAddress);
}, []);

const selectedTotalQORT = useMemo(() => {
  return selectedOffers.reduce((acc, curr) => {
    return acc + (+curr.qortAmount || 0); // Ensure qortAmount is defined
  }, 0);
}, [selectedOffers]);


const onGridReady = useCallback((params: any) => {
  params.api.sizeColumnsToFit(); // Adjust columns to fit the grid width
  const allColumnIds = params.columnApi.getAllColumns().map((col: any) => col.getColId());
  params.columnApi.autoSizeColumns(allColumnIds); // Automatically adjust the width to fit content
}, []);


const handleClose = (
  event?: React.SyntheticEvent | Event,
  reason?: SnackbarCloseReason,
) => {
  if (reason === 'clickaway') {
    return;
  }

  setOpen(false);
  setInfo(null)
};



  return (
    <Box sx={{
      width: '100%',
    }}>
    <div className="ag-theme-alpine-dark" style={{ height: 400, width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={offersWithoutOngoing}
        onRowClicked={onRowClicked}
        onSelectionChanged={onSelectionChanged}
        getRowStyle={getRowStyle}
        autoSizeStrategy={autoSizeStrategy}
        rowSelection="multiple" // Enable multi-select
        rowMultiSelectWithClick={true}
        suppressHorizontalScroll={false} // Allow horizontal scroll on mobile if needed
        suppressCellFocus={true} // Prevents cells from stealing focus in mobile
        // pagination={true}
        // paginationPageSize={10}
        onGridReady={onGridReady}
      //  domLayout='autoHeight'
        getRowId={(params) => params.data.qortalAtAddress} // Ensure rows have unique IDs 
      />
      {/* {selectedOffer && (
        <Button onClick={buyOrder}>Buy</Button>

      )} */}
    </div>
    <Box sx={{
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'fixed',
      bottom: '0px',
      height: '80px',
      padding: '7px',
      background: '#181d1f',

    }}>
      <Box sx={{
        display: 'flex',
        gap: '5px',
        flexDirection: 'column',
        width: '100%'
      }}>
       <Typography sx={{
          fontSize: '16px',
          color: 'white',
          width: 'calc(100% - 75px)'
        }}>{selectedTotalQORT.toFixed(3)} QORT</Typography> <Typography sx={{
          fontSize: '16px',
          color: 'white',
          width: 'calc(100% - 75px)'
        }}><span>{selectedTotalLTC.toFixed(4)}</span> <span style={{
          marginLeft: 'auto'
        }}>LTC</span></Typography>
      </Box>
      {BuyButton()}
    </Box>
    <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert
                

          onClose={handleClose}
          severity={info?.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {info?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

