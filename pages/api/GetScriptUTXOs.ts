// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import {BlockfrostProvider} from "@meshsdk/core";
import axios from "axios";
import GetScriptTransactionsResponse from "../interfaces/GetScriptTransactionsResponse";


type Data = {
    name: string;
};

interface BlockfrostTxInfo {
    tx_hash: string;
    tx_index: number;
    block_height: number;
    block_time: number;
}



const header = {headers: {'project_id': process.env.BLOCKFROST_API_KEY}};


async function getTxUtxos(txHash: string) {
    return axios.get<{outputs: {inline_datum: string}[]}>(`${process.env.BLOCKFROST_BASE_URL}/txs/${txHash}/utxos`, header);
}

async function getScriptTransactions(scriptAddress: string) {
    return axios.get(`${process.env.BLOCKFROST_BASE_URL}/addresses/${scriptAddress}/transactions`, header);
}

// @ts-ignore
const blockfrostProvider = new BlockfrostProvider(process.env.BLOCKFROST_BASE_URL, process.env.BLOCKFROST_API_KEY)

async function fetchAddressTransaction(scriptAddress: string) {
    const data : GetScriptTransactionsResponse[] = [];
    const scriptTransactions = await getScriptTransactions(scriptAddress);
    for (const tx of scriptTransactions.data) {
        console.log(tx.tx_hash)
        const transactionUTxos = await getTxUtxos(tx.tx_hash);
        transactionUTxos.data.outputs.filter((output) => output.inline_datum).forEach((output) => {
            console.log(output.inline_datum);
            data.push({tx_hash: tx.tx_hash, tx_datum: output.inline_datum});
        });
    }
    return data;
}

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>,
) {

    const scriptAddress = req.body;
    fetchAddressTransaction(scriptAddress).then((data) => {
        console.log(data)
        res.status(200).json({name: JSON.stringify(data)});
    });


}
