
let namedEntitiesRawObject = fetch("entities.json").then(response=>response.json()).then(data=>data);
namedEntitiesRawObject.then(data=>{
    console.log(data);
    window.namedEntities = data;

    let keptValues = new Array()
    for (const [key, value] of Object.entries(window.namedEntities)) {
            if(value.codepoints[0]>126){
                keptValues.push(key)
        }
    }
    window.keptValues = keptValues;
    window.regExpNamedEntities = new RegExp("&("+keptValues.join("|").replaceAll("&",'')+")","gi");   
});

window.encodingByteCounter = {
    "utf-8": (codepoint) => {
      if (codepoint <= 0x007F) return 1; // 1 byte for ASCII
      if (codepoint <= 0x07FF) return 2; // 2 bytes for codepoints up to 0x07FF
      if (codepoint <= 0xFFFF) return 3; // 3 bytes for codepoints up to 0xFFFF
      return 4; // 4 bytes for codepoints up to 0x10FFFF
    },
    
    "shift_jis": (codepoint) => {
      if (codepoint <= 0x007F || (codepoint >= 0xA1 && codepoint <= 0xDF)) return 1; // 1 byte for ASCII and Katakana
      return 2; // 2 bytes for Kanji
    },
  
    "gbk": (codepoint) => {
      return (codepoint <= 0x007F) ? 1 : 2; // 1 byte for ASCII, 2 bytes otherwise
    },
  
    "gb18030": (codepoint) => {
      if (codepoint <= 0x007F) return 1; // 1 byte for ASCII
      if (codepoint <= 0xFFFF) return 2; // 2 bytes for codepoints up to 0xFFFF
      return 4; // 4 bytes for higher codepoints
    },
  
    "big5": (codepoint) => {
      return (codepoint <= 0x007F) ? 1 : 2; // 1 byte for ASCII, 2 bytes otherwise
    },
    "windows-31j": (codepoint) => {
        if (codepoint <= 0x007F || (codepoint >= 0xA1 && codepoint <= 0xDF)) return 1; // 1 byte for ASCII and Katakana
        if (codepoint >= 0xE0 && codepoint <= 0xEF) return 1; // 1 byte for additional characters in this range
        return 2; // 2 bytes for Kanji and other characters
    },
    "euc-jp": (codepoint) => {
        if (codepoint <= 0x007F) return 1; // 1 byte for ASCII
        return 2; // Default to 2 bytes for unhandled cases
    },

  
    "iso-2022-jp": (codepoint) => {
      return (codepoint <= 0x007F) ? 1 : -1; // 1 byte for ASCII, special handling for escape sequences
    },
  
    "euc-kr": (codepoint) => {
      return (codepoint <= 0x007F) ? 1 : 2; // 1 byte for ASCII, 2 bytes otherwise
    },
  
    "utf-16be": (codepoint) => {
      return (codepoint <= 0xFFFF) ? 2 : 4; // 2 bytes for BMP characters, 4 bytes for supplementary
    },
  
    "utf-16le": (codepoint) => {
      return (codepoint <= 0xFFFF) ? 2 : 4; // 2 bytes for BMP characters, 4 bytes for supplementary
    }
  };

findByteCountEscapeSequences = function(decoder,escapeLength,nextBytes,character,defaultByteCount) {
    for(let i=1;i<=4;i++)
    {
        let byteCount = i;
        let escapeSequence = nextBytes.slice(0,escapeLength+ i);
        let decoded = decoder.decode(escapeSequence);
        if(decoded==character)
        {
            // console.info("Found escape sequence",escapeSequence,"for character",character,"byteCount",byteCount);
            return byteCount;
        }
        // console.info("Escape sequence",escapeSequence,"didn't match character",character,"decoded",decoded);
    }
    console.error("Couldn't find escape sequence for character",character,"defaultByteCount")
    return defaultByteCount;
}
  
window.uDarkDecode = function(charset,data,decoderOptions={}) {
    
    let start= performance.now();
    charset = charset.toLowerCase();
    if(charset==null||charset=="")
    {
        charset="utf-8";
    }
    let decoder=new TextDecoder(charset,decoderOptions);

    if(charset=="utf-8")
    {
        return decoder.decode(data);;
    }

    if(!charset in encodingByteCounter)
    {
        encodingByteCounter[charset]={monoByte:1};
    }
    let fnCharset = encodingByteCounter[charset];
    if(!fnCharset.map)
    {
        fnCharset.map=new Map();
    }
    let decoded = "";
    if(charset == "iso-2022-jp"){
         decoded = uDarkDecodeEscapeSequence(charset,data,decoderOptions);
    }
    else{
        let doubleAsciiCharset = charset.startsWith("utf-16");
        // foreach character in decoded
        // get codepoint
        // get byte count
        // get encoding byte count
        // if byte count != encoding byte count

        decoded = decoder.decode(data);

        let splitDecode = Array.from(decoded); // Using Array.from to split the string into an array of characters because multiple bytes are used for some characters, it handles that correctly

        let dataIndex=0;
        let charUint8Array = new Uint8Array(data);
        
        
        splitDecode.forEach((char,index)=>{
            let codepoint=char.codePointAt(0); // codePointAt handles surrogate pairs correctly
            let knownCodepoint = fnCharset.map.get(codepoint);
            
            if(codepoint<=126 && !doubleAsciiCharset || knownCodepoint) 
            {
                dataIndex+=knownCodepoint ? knownCodepoint.length : 1;
                return;
            }
            
            let encodingByteCount=fnCharset.monoByte||fnCharset(codepoint);
            if(codepoint==180)
            {
                console.log("Codepoint",codepoint,"encodingByteCount",encodingByteCount,"char",char,"index",index,"dataIndex",dataIndex,charUint8Array.slice(dataIndex,dataIndex+encodingByteCount));
            }
        // console.log("Saving codepoint",codepoint,"char",char,"index",index,"dataIndex",dataIndex,"encodingByteCounter",encodingByteCounter);
            fnCharset.map.set(codepoint,charUint8Array.slice(dataIndex,dataIndex+encodingByteCount));
            dataIndex+=encodingByteCount;
        })
    }
    decoded=decoded.replaceAll(/&#(x?[0-9A-F]+)/g,function(match,g1){
        return "&##"+g1;
    }).replaceAll(window.regExpNamedEntities,function(match,g1){
        return "&#########"+g1;
    }); // Avoid &# charaters to be decoded, since we don't have their encoding in relative charset. Using &## is safe because it's not a valid HTML entity and smart because it wont break if page already has &## somewhere in it
    let end=performance.now();
    console.log("Decoding took",end-start,"ms");
    return decoded;

}

function findSequence(arr, sequence) {
    const seqLen = sequence.length;
    const arrLen = arr.length;
  
    // Loop through the array
    for (let i = 0; i <= arrLen - seqLen; i++) {
      // Check if the slice matches the sequence
      if (arr.slice(i, i + seqLen).every((val, index) => val === sequence[index])) {
        return i; // Return the starting index
      }
    }
    return -1; // If sequence is not found
  }
  
window.uDarkEncode= function(charset,str) {
    charset = charset.toLowerCase();
    if(charset==null||charset=="")
    {
        charset="utf-8";
    }
    let encoder=new TextEncoder();
    if(charset=="utf-8")
    {
        return encoder.encode(str);
    }

    // console.log("Encoding into charset",charset,"str",str);
    str = str.replaceAll(/&##(x?[0-9A-F]+)/g,function(match,g1){
        return "&#"+g1;
    }).replaceAll(/&(amp;)?#########/g,function(match,g1){
        return "&"
    }); // Restore &# charaters to be decoded, since we don't have their encoding in relative charset. Using &## is safe because it's not a valid HTML entity and smart because it wont break if page already has &## somewhere in it

    let strSplit = Array.from(str); // Using Array.from to split the string into an array of characters because multiple bytes are used for some characters, it handles that correctly
   
    let fnCharset = encodingByteCounter[charset];
    let doubleAsciiCharset = charset.startsWith("utf-16");
    let start= performance.now();
    let encoded = new Array();
 
    strSplit.forEach((char,index)=>{
        let codepoint=char.codePointAt(0); // codePointAt handles surrogate pairs correctly
        if(codepoint<=126 && !doubleAsciiCharset) 
        {
            encoded.push(char.charCodeAt(0));
            return;
        }
        let knownCodepoint = fnCharset.map.get(codepoint);
      
        if(!knownCodepoint)
        {
            console.log(str)
            console.warn("Codepoint not found in map",codepoint,"char",char,"index",index,fnCharset.map,charset);
        }
        if(knownCodepoint)
        {
            for(let i=0;i<knownCodepoint.length;i++)
            {
                encoded.push(knownCodepoint[i]);
            }
        }

    });
    let end=performance.now();
    console.log("Encoding took",end-start,"ms");
    let redDecoded=new TextDecoder(charset).decode(new Uint8Array(encoded));
    for(let i=0;i<1000;i++)
    {
        str=str.replaceAll(String.fromCodePoint(10084+ i),"");
    }
    if(redDecoded!=str){
        console.warn("Encoding/Decoding Mismatch");

        console.log("Original",str);
        console.log("Decoded",redDecoded);
        // Find first Mismatch character  with codepoint <0xFF00
        let aSplit = Array.from(str);
        let reSplit = Array.from(redDecoded);
        
        for(let i=0;i<reSplit.length;i++)
        {
            if(reSplit[i]!=aSplit[i])
            {
                console.log("Mismatch at",i,"Original",aSplit[i],"Decoded",reSplit[i]);

                let aroundSize=40;
                let [before,after]=[aSplit.slice(i-aroundSize,i+aroundSize).join(""),reSplit.slice(i-aroundSize,i+aroundSize).join("")]
                console.log( "Text around : ",before!=after,before,after);
                console.log("bytes around",new Uint8Array(encoded).slice(i-40,i+40),new Uint8Array(encoder.encode(str)).slice(i-40,i+40));

                break;
            }
        }

    }
    return new Uint8Array(encoded);
    
}

function splitEscSequences(arr) {
    let sequences = [];
    let start = 0;
    let nextIndex = arr.indexOf(27, start);
    
    while (nextIndex !== -1) {
        // Slice the array from the current start to the found 27
        if (nextIndex !== start) {
            sequences.push(arr.slice(start, nextIndex));
        }
        start = nextIndex;  // Update start to the index of 27
        nextIndex = arr.indexOf(27, start + 1);  // Find the next occurrence of 27
    }
    
    // Push the last sequence from the last found 27 to the end of the array
    if (start < arr.length) {
        sequences.push(arr.slice(start));
    }
    
    return sequences;
}



window.uDarkDecodeEscapeSequence = function(charset,bufferData,decoderOptions={}) {

    charset = charset.toLowerCase();
    if(charset==null||charset=="")
    {
        charset="utf-8";
    }
    let decoder=new TextDecoder(charset,decoderOptions);
    

    if(charset=="utf-8")
    {
        return decoder.decode(bufferData);
    }
    let fnCharset = encodingByteCounter[charset];
    if(!fnCharset.map)
    {
        fnCharset.map=new Map();
    }

    let data=new Uint8Array(bufferData);
    let escapeSequences = splitEscSequences(data);
    fnCharset = encodingByteCounter[charset];
    fnCharset.escapeSequencesReplacements = fnCharset.escapeSequencesReplacements || new Map();
    let decoded="";
    console.log(escapeSequences);
    let start= performance.now();
    escapeSequences.forEach((sequence) => {
        let decodedSequence = decoder.decode(sequence);
        let usedChar = ""
        if(sequence[0] === 27) {
            let escapeSequence = sequence.slice(0, 3 );
            usedChar=fnCharset.escapeSequencesReplacements.get(escapeSequence.toString());
            
            let sequenceByteCount=findByteCountEscapeSequences(decoder,3,sequence.slice(0,7),decodedSequence.charAt(0));
            if (!usedChar) {
                let usedCharCodePoint = 10084 + fnCharset.escapeSequencesReplacements.size;
                usedChar = String.fromCodePoint(usedCharCodePoint);
                fnCharset.escapeSequencesReplacements.set(escapeSequence.toString(), usedChar);
                fnCharset.map.set(usedCharCodePoint, escapeSequence);
                if(!sequenceByteCount){
                    console.error("Couldn't find byte count for escape sequence",decodedSequence.charAt(0),"defaultByteCount")
                    throw new Error("Couldn't find byte count for escape sequence");
                }
                console.info("Inserted escape sequence", "usedChar", usedChar, "escapeSequence", escapeSequence, "sequenceByteCount", sequenceByteCount,);
            }
            Array.from(decodedSequence).forEach((char, index) => {
                let codepoint = char.codePointAt(0);
                if(codepoint>126 && !fnCharset.map.has(codepoint))
                {
        
                    let dataIndex = index*sequenceByteCount+3;
                    let charBytes = sequence.slice(dataIndex, dataIndex + sequenceByteCount);
                    fnCharset.map.set(codepoint, charBytes);
                }
            });
        
        }
        decoded += usedChar+decodedSequence;
    });
    

    let end=performance.now();
    console.log("Decoding took",end-start,"ms");
    return decoded;

}