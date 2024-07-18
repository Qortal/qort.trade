import React, { useContext, useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import gameContext from '../../contexts/gameContext';
export const OngoingTrades = () => {
    const { onGoingTrades } = useContext(gameContext);



    const columnDefs: ColDef[] = [
        { headerName: "Status", valueGetter: (params) => {
            if(params.data.tradeInfo.mode !== 'OFFERING') return params.data.tradeInfo.mode.toLowerCase()
            if(params.data.status === 'message-sent') return 'requested buy order'
            if(params.data.status === 'trade-ongoing') return 'submitted buy order'
            if(params.data.status === 'trade-failed') return 'buy order failed'
            return params.data.status
        }},
        { headerName: "Amount (QORT)", valueGetter: (params) => +params.data.tradeInfo.qortAmount  },
        { headerName: "Price (LTC)", valueGetter: (params) => +params.data.tradeInfo.expectedForeignAmount / +params.data.tradeInfo.qortAmount, sortable: true, sort: 'asc' },
        { headerName: "Total (LTC)", valueGetter: (params) => +params.data.tradeInfo.expectedForeignAmount },
        { headerName: "Notes", valueGetter: (params) => {
            if(params.data.tradeInfo.mode === 'TRADING'){
                return 'The order is in the process of exchanging hands. This does not necessary mean it was purchased by your account. Wait until the process is completed.'
            }
            if(params.data.tradeInfo.mode === 'REDEEMED'){
                return "You have successfully purchased this order. Please wait for the QORT balance to be updated"
            }
            if(params.data.status === 'message-sent'){
                return 'Buy request was sent, waiting for trade confirmation.'
            }
            if(params.data.message) return params.data.message
        } }
      ];
    
    // const getRowStyle = (params: any) => {
    //     if (params.data.qortalAtAddress === selectedOffer?.qortalAtAddress) {
    //       return { background: 'lightblue' };
    //     }
    //     return null;
    //   };

  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={onGoingTrades}
        // onRowClicked={onRowClicked}
        rowSelection="single"
        // getRowStyle={getRowStyle}

      />
    </div>
  );
}
