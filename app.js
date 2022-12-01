const  ipfsClient  = require('ipfs-http-client');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const fileUpload = require("express-fileupload");
const { ethers } = require('ethers');
var cors = require('cors');
const path = require('path');

const { exit } = require('process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
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

/*
var ip = "";
exec('node | curl ifconfig.me', (err, stdout) => {
   if (err) {
        console.log("cannot get ip, command failed : curl ifconfig.me");
        exit();
    }
    ip = stdout.trim();
});
 */  

let ip = "0.0.0.0";
async function ls() {
  const { stdout} = await exec('curl ifconfig.me');
  return  stdout.trim();
}


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
		finalHash: finalHash.toString(),
	}
	return res.status(200).json(responseObject)
    });
});

app.get("/token_burn",(req,res)=>{
    const token_id = req.query.token_id;
    try{
        // console.log(req.ip);
        execute(token_id);
        return res.status(200);
    }catch(err){
        console.log("error occurred" , err);
        return res.status(500);
    }
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


async function execute(token_burn) {
	const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
	// const abi = await (await fetch('public/contract_abi.json')).json();
    
    let rawdata = fs.readFileSync('public/contract_abi.json');
    let abi = JSON.parse(rawdata);
    // console.log(abi);
    const provider = new ethers.providers.JsonRpcProvider(`http://${ip}/blockchain`)
    const signer = provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
	const contract = new ethers.Contract(contractAddress, abi, signer);
	const token_burn_response = await contract.burnExpiredToken(token_burn);
    // const aa  = (await contract.getListingPrice()).toString();
    console.log(token_burn_response);
}

// execute();


app.listen(3000,'0.0.0.0',async () => {
    ip = await ls();
    console.log("current public ip address : " ,ip);
    console.log("server id listening at port 3000");
});


