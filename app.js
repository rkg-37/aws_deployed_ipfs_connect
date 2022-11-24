const  ipfsClient  = require('ipfs-http-client');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const fileUpload = require("express-fileupload");
const { consumers } = require('stream');
var cors = require('cors')

const ipfs = ipfsClient.create({host:'localhost',port:'5001',protocol:'http'});
const app = express();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(fileUpload());

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
    //const warranty_id = req.body.warranty_id;
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
                "product_image_hash":fileHash.toString()
            },
            "warranty":{
     //           "warranty_id":warranty_id,
                "warranty_name":warranty_name,
                "warranty_desc":warranty_desc,
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


app.listen(3000,'0.0.0.0',() => {
    console.log("server id listening at prt 3000");
});


