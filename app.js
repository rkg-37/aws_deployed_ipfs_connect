const  ipfsClient  = require('ipfs-http-client');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const fileUpload = require("express-fileupload");
const { ethers } = require('ethers');
var cors = require('cors');
const path = require('path');
const fetch = require("node-fetch");

const ipfs = ipfsClient.create({host:'localhost',port:'5001',protocol:'http'});
const app = express();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(fileUpload());
// app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static("public"));
/*app.use(cors({
        origin: ["http://127.0.0.1:5500"]
    })
)*/

//app.use(cors());


if (!fs.existsSync("./files")) {
	fs.mkdirSync("./files");
}

const hash_dir = [];

app.get('/home',(req,res)=>{
    res.render("home");
});

app.post('/upload',(req,res)=>{
    
    const file = req.files.file;
    const fileName = req.files.file.name;
    const product_id = req.body.product_id;
    const product_name = req.body.product_name;
    const product_desc = req.body.product_desc;
    const product_price = req.body.product_price;
    const warranty_secretkey = req.body.warranty_secretkey;
    const expiry_duration = req.body.expiry_duration;
    const warranty_name = req.body.warranty_name;
    const warranty_desc = req.body.warranty_desc;
    
    
    const filePath = 'files/'+fileName;
	
    let responseObject = null;
    file.mv(filePath,async(err) => {
        if(err){
            console.log(err);
            return res.status(500).send(err);
        }

        const fileHash = await addFile(fileName,filePath);
        fs.unlink(filePath,async(err) => {
            if(err){
                console.log(err);
            };
        });
        
        const prod = {
            "Product":{
                "product_id":product_id,
                "product_name":product_name,
                "product_desc":product_desc,
                "product_price":product_price,
                "product_image_hash":fileHash.toString()
            },
            "warranty":{
               "warranty_secretkey":warranty_secretkey,
                "warranty_name":warranty_name,
                "warranty_desc":warranty_desc,
                "expiry_duration":expiry_duration
            }
        }
        // console.log(JSON.stringify(prod));
        const finalHash = await AddingJson(prod);
        // console.log(hash_dir);
        //res.render('upload',{fileName,finalHash});
	console.log(fileName, finalHash.toString());
/*
	return res.status(200).json({
		fileName: fileName, 
		finalHash: fileHash.toString()
	})
*/
	responseObject = {
		fileName: fileName,
		finalHash: fileHash.toString(),
	}
	return res.status(200).json(responseObject)
    });
});


// adding images
const addFile = async(fileName,filePath)=>{
    const file = fs.readFileSync(filePath);
    const fileAdded = await ipfs.add({path: fileName,content:file});
    
    // const fileHash = fileAdded[0].hash;
    const fileHash = fileAdded.cid;

    return fileHash;
}


const AddingJson = async(input)=>{
    const json = JSON.stringify(input);
    const finalHash = (await ipfs.add(Buffer.from(JSON.stringify(input)))).cid;
    hash_dir.push(finalHash);
    return finalHash;
}

// const AddingJson = ipfs.add(Buffer.from(JSON.stringify(input)))
//   .then(res => {
//     return res.cid;
// });


async function connect() {
	if (typeof window.ethereum !== 'undefined') {
		console.log('We are in!!');
		await ethereum.request({ method: 'eth_requestAccounts' });
	}
}


async function execute() {
	const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
	// const abi = await (await fetch('public/contract_abi.json')).json();
    
    let rawdata = fs.readFileSync('public/contract_abi.json');
    let abi = JSON.parse(rawdata);
    // console.log(abi);
    const provider = new ethers.providers.JsonRpcProvider("http://54.83.105.94/blockchain")
    const signer = provider.getSigner();
	const contract = new ethers.Contract(contractAddress, abi, signer);
    const token_id = 22;
	// await contract.burnExpiredToken(token_id);
    const aa  = await contract.getListingPrice().toString();
    // console.log(aa);
}

console.log(execute());


app.listen(3000,'0.0.0.0',() => {
    console.log("server id listening at prt 3000");
});


