
let namedEntitiesRawObject = fetch("entities.json").then(response=>response.json()).then(data=>data);
namedEntitiesRawObject.then(data=>{
    uDark.success("Named entities loaded");
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

/*
 * Potential Bug: Misalignment Due to Undefined Byte Values in Multi-byte Encodings
 *
 * In multi-byte encodings like Big5, Shift JIS, EUC-JP, and GBK, certain byte values 
 * (e.g., 0x80 in Big5, 0x80 and 0xA0 in Shift JIS) are undefined or reserved. These 
 * bytes do not form valid parts of any multi-byte character sequences.
 *
 * If these undefined bytes are not treated carefully, they can cause misalignment 
 * within multi-byte sequences. Misalignment occurs when the algorithm mistakenly tries 
 * to interpret these undefined bytes as part of a two-byte sequence, resulting in 
 * parsing errors or incorrect character interpretation.
 * 
 * Solution:
 * - Treat undefined bytes like 0x80 as single-byte characters, effectively isolating 
 *   them so they do not interfere with the expected two-byte sequences.
 * - This approach ensures that each valid two-byte sequence remains aligned and is 
 *   parsed correctly.
 * 
 * Example: In Big5, if 0x80 is received, handle it as a single-byte character to 
 * avoid misalignment in multi-byte processing.
 */

window.encodingByteCounter = {
    "utf-8": (codepoint) => {
      if (codepoint <= 0x007F) return 1; // 1 byte for ASCII
      if (codepoint <= 0x07FF) return 2; // 2 bytes for codepoints up to 0x07FF
      if (codepoint <= 0xFFFF) return 3; // 3 bytes for codepoints up to 0xFFFF
      return 4; // 4 bytes for codepoints up to 0x10FFFF
    },
    
    "shift_jis": (codepoint) => {
        
      if (codepoint <= 0x007F) return 1; // 1 byte for ASCII and Katakana
      if (codepoint >= 0x80 && codepoint <= 0x9F) return 1; // 1 byte for additional Katakana but in the range 0x80-0x9F for unicode compatibility
      if(codepoint>=0xFF61 && codepoint<=0xFF9F) return 1; // 1 byte for additional Katakana but in the range 0xFF61-0xFF9F for unicode compatibility
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
      return (codepoint <= 0x007F+1) ? 1 : 2; // 1 byte for ASCII (+1 : Extended to the invalid inbetween byte 0x80 that will ever be single ), 2 bytes otherwise 
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
            // uDark.info("Found escape sequence",escapeSequence,"for character",character,"byteCount",byteCount);
            return byteCount;
        }
        // uDark.info("Escape sequence",escapeSequence,"didn't match character",character,"decoded",decoded);
    }
    uDark.error("Couldn't find escape sequence for character",character,"defaultByteCount")
    return defaultByteCount;
}

window.getSafeDecoder = function(charset,decoderOptions={}) {
    let decoder=null;
    try{
        decoder=new TextDecoder(charset,decoderOptions);
    }
    catch(e)
    {
        uDark.warn("Couldn't create decoder for charset",charset);
        decoder=new TextDecoder("utf-8",decoderOptions);
    }
    return decoder;
};

window.uDarkDecode = function(charsetUnsafe,bufferData,decoderOptions={},url) {
    uDark.log("Decoding into charset",charsetUnsafe,url);
    
    
    let start= performance.now();
    
    let decoder = getSafeDecoder(charsetUnsafe,decoderOptions);
    let charset = decoder.encoding;
    if(charset=="utf-8"){
        return decoder.decode(bufferData);
    }
    if(url)
        {
            
        testURLCharset(url,charsetUnsafe);
        }
    if(!(charset in encodingByteCounter))
    {
        uDark.log("Creating encoding byte counter for",charset);
        encodingByteCounter[charset]={monoByte:1};
    }
    let fnCharset = encodingByteCounter[charset];
    uDark.log("Decoding into charset",charset,fnCharset);
    if(!fnCharset.map)
    {
        fnCharset.map=new Map();
    }
    let decoded = "";
    
    if(charset == "iso-2022-jp"){
         decoded = uDarkDecodeEscapeSequence(decoder,fnCharset,bufferData);
    }
    // else if(charset == "shift_jis"){
    //     decoded= dynamicDecoderCharacterCounter(decoder,fnCharset,bufferData);
    
    // }
    else{
        decoded = uDarkDecodeSimple(decoder,fnCharset,bufferData);
    }
    // Now uDarkHTMLEntityProtected as a wholde word is a forbidden string in the page, this is why do the concatenation in two steps, i never want to see this string in a page ever again.
    let replacement= "uDark"+"HTMLEntityProtected$1";
    // Since replacement will never contain a $& it's safe to use it as a replacement string without callback function.
    decoded=decoded.replaceAll(/&(#x?[0-9A-F]+)/g,replacement).replaceAll(window.regExpNamedEntities,replacement);
    let end=performance.now();
    uDark.log("Decoding took",end-start,"ms");
    return decoded;

}

window.uDarkDecodeSimple = function(decoder,fnCharset,bufferData) {
    // foreach character in decoded
        // get codepoint
        // get byte count
        // get encoding byte count
        // if byte count != encoding byte count

        let doubleAsciiCharset = decoder.encoding.startsWith("utf-16");
        decoded = decoder.decode(bufferData);

        let splitDecode = Array.from(decoded); // Using Array.from to split the string into an array of characters because multiple bytes are used for some characters, it handles that correctly

        let dataIndex=0;
        let charUint8Array = new Uint8Array(bufferData);
        


        splitDecode.forEach((char,index)=>{
            let codepoint=char.codePointAt(0); // codePointAt handles surrogate pairs correctly
            let knownCodepoint = fnCharset.map.get(codepoint);
        
            if((codepoint<=126 && !doubleAsciiCharset || knownCodepoint) && char != "�") // We cant trust the � character, for the number of bytes of the one we have in map  it can be the result of single bytes or multibyte characters.
            {
                let shifting = knownCodepoint ? knownCodepoint.length : 1;
                
                // {
                //     let currentNextBytes = charUint8Array.slice(dataIndex,dataIndex+shifting);

                //     let currentNextBytesDecoded = decoder.decode(currentNextBytes);
                //     if(currentNextBytesDecoded!=char)
                //     {
                //         console.error("1 Couldn't find encoding byte count for character","'"+char+"'","defaultByteCount",1,currentNextBytes,"decodes to","'"+currentNextBytesDecoded+"'");
                //         currentNextBytesDecodedCodepoint=currentNextBytesDecoded.codePointAt(0);
                //         console.log("Codepoints",codepoint,currentNextBytesDecodedCodepoint);
                //         console.log("Known codepoint",knownCodepoint);
                //         console.log("Previous char given current data index",splitDecode[index-1],charUint8Array.slice(dataIndex-1,dataIndex+1));
                //         console.log(index,codepoint,char,dataIndex,currentNextBytes,currentNextBytesDecoded,knownCodepoint);
                //         let aroundSize=5;
                //         let [before,after]=[splitDecode.slice(index-aroundSize,index+aroundSize).join(""),decoded.slice(index-aroundSize,index+aroundSize)];
                //         console.log("Text around is different",before!=after);
                //         console.table({before,after});
                        
                //         throw new Error("1 Couldn't find encoding byte count for character");
                //     }
                    
                //     console.log("1. Pushing data index",dataIndex,"by",shifting,"for",char,"index",index,"getting",dataIndex+shifting);
                // }
                dataIndex+=shifting;
                return;
            }

            let nextBytes = null;
            var encodingByteCount = 0;
            if(char=="�")
            {
                for(encodingByteCount of [2,1,3,4]){
                    // Using variable leakage at our advantage, we will keep the last value of encodingByteCount
                    nextBytes = charUint8Array.slice(dataIndex,dataIndex+encodingByteCount);
                    let nextBytesDecoded =  decoder.decode(nextBytes);
                    if(nextBytesDecoded==char){
                        break;
                    }
                };
                // console.log("�",codepoint,"DataIndex",dataIndex,"Codepoint",codepoint,"char",char,"index",index,"dataIndex",dataIndex,knownCodepoint,"encodingByteCount",encodingByteCount,"nextBytes",nextBytes,"decodedBytes",nextBytesDecoded);
            }
            else
            {
                encodingByteCount=fnCharset.monoByte||fnCharset(codepoint);
            }
            // if(!encodingByteCount)
            // {
            //     console.error("2 Couldn't find encoding byte count for character",char,"defaultByteCount",encodingByteCount,nextBytes,"decodes to","'"+decoder.decode(nextBytes)+"'");
            //     throw new Error("2 Couldn't find encoding byte count for character");
            // }

            // if(isMultiRoleChar)
            // {
            //     let nextBytesDecoded =  decoder.decode(charUint8Array.slice(dataIndex,dataIndex+encodingByteCount));
            //     encodingByteCount = [1,2,3,4].find((byteCount)=>{
            //         let nextBytesDecoded =  decoder.decode(charUint8Array.slice(dataIndex,dataIndex+byteCount));
            //         return nextBytesDecoded==char;
            //     }); 
            // }
            // else
            if(!knownCodepoint)
            {
                fnCharset.map.set(codepoint,nextBytes||charUint8Array.slice(dataIndex,dataIndex+encodingByteCount));
            }

            /*

            new TextDecoder().decode(new Uint8Array([128])) == "�"
            true
            new TextDecoder("shift_jis").decode(new Uint8Array([128])) == "�"
            false 
            */


            dataIndex+=encodingByteCount;
        })
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
  
window.uDarkEncode= function(charsetUnsafe,str) {
    let charset = getSafeDecoder(charsetUnsafe).encoding;
    let encoder=new TextEncoder();
    if(charset=="utf-8")
    {
        return encoder.encode(str);
    }

    // Now uDarkHTMLEntityProtected as a wholde word is a forbidden string in the page, this is why do the concatenation in two steps
    // I never want to see this string in a page ever again.
    str=str.replaceAll("uDark"+"HTMLEntityProtected","&");
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
    // let redDecoded=new TextDecoder(charset).decode(new Uint8Array(encoded));
    // for(let i=0;i<1000;i++)
    // {
    //     str=str.replaceAll(String.fromCodePoint(10084+ i),"");
    // }
    // if(redDecoded!=str){
    //     console.warn("Encoding/Decoding Mismatch");

    //     console.log("Original",str);
    //     console.log("Decoded",redDecoded);
    //     // Find first Mismatch character  with codepoint <0xFF00
    //     let aSplit = Array.from(str);
    //     let reSplit = Array.from(redDecoded);
        
    //     for(let i=0;i<reSplit.length;i++)
    //     {
    //         if(reSplit[i]!=aSplit[i])
    //         {
    //             console.log("Mismatch at",i,"Original",aSplit[i],"Decoded",reSplit[i]);

    //             let aroundSize=40;
    //             let [before,after]=[aSplit.slice(i-aroundSize,i+aroundSize).join(""),reSplit.slice(i-aroundSize,i+aroundSize).join("")]
    //             console.log( "Text around : ",before!=after,before,after);
    //             console.log("bytes around",new Uint8Array(encoded).slice(i-40,i+40),new Uint8Array(encoder.encode(str)).slice(i-40,i+40));

    //             break;
    //         }
    //     }

    // }
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


window.dynamicDecoderCharacterCounter = function(decoder,fnCharset,bufferData)
{
    console.warn("Using dynamicDecoderCharacterCounter");
    
    decoded = decoder.decode(bufferData);

    let splitDecode = Array.from(decoded); // Using Array.from to split the string into an array of characters because multiple bytes are used for some characters, it handles that correctly
    
    let dataIndex=0;
    let charUint8Array = new Uint8Array(bufferData);
    
    outerLoop: for(let i=0;i<splitDecode.length;i++)
    {   
        let char = splitDecode[i];
        
        let codepoint=char.codePointAt(0); // codePointAt handles surrogate pairs correctly
        let knownCodepoint = fnCharset.map.get(codepoint);
        
        // console.log("\n");

        // if(codepoint==65533)
        // {
        //     console.warn(codepoint,"DataIndex",dataIndex,"Codepoint",codepoint,"char",char,"index",i,"dataIndex",dataIndex,knownCodepoint);
        // }
        if((codepoint<=126 || knownCodepoint) && char != "�") // We cant trust the � character, for the number of bytes of the one we have in map  it can be the result of single bytes or multibyte characters.  
        {
            // if(knownCodepoint)
            // {
            //     console.log("Skipping known codepoint",codepoint,"char",char,"index",i,"dataIndex",dataIndex,"knownCodepoint",knownCodepoint);
            // }
            // else
            // {   
            //     console.log("Skipping ASCII character",codepoint,"char",char,"index",i,"dataIndex",dataIndex);
            // }
            let shifting = knownCodepoint ? knownCodepoint.length : 1;
            // let currentNextBytes = charUint8Array.slice(dataIndex,dataIndex+shifting);

            // let currentNextBytesDecoded = decoder.decode(currentNextBytes);
            // console.log("1 Current nextbytes are",currentNextBytes,"and decodes to",currentNextBytesDecoded, "shifting",shifting);
            // if(currentNextBytesDecoded!=char)
            // {
            //     console.error("1 Couldn't find encoding byte count for character",char,"defaultByteCount",1,currentNextBytes,"decodes to",currentNextBytesDecoded);
            //     throw new Error("1 Couldn't find encoding byte count for character");
            // }
            // console.log("Continuing with",char,"index",i,"dataIndex",dataIndex);
            dataIndex+=shifting;
            continue outerLoop;
        }
        
        let nextBytes = null;
        for(var encodingByteCount of [2,1,3,4]) // Using variable leakage at our advantage, we will keep the last value of encodingByteCount
        {
            nextBytes = charUint8Array.slice(dataIndex,dataIndex+encodingByteCount);
            let nextBytesDecoded =  decoder.decode(nextBytes);
            if(nextBytesDecoded==char){break;}
        }
        if(!encodingByteCount)
        {
            console.error("2 Couldn't find encoding byte count for character",char,"defaultByteCount",encodingByteCount,nextBytes,"decodes to","'"+decoder.decode(nextBytes)+"'");
            throw new Error("2 Couldn't find encoding byte count for character");
        }
        // if(codepoint==65533 )
        // {
        //     console.log(codepoint+"setting","DataIndex",dataIndex,"Codepoint",codepoint,"char",char,"index",i,"dataIndex",dataIndex,knownCodepoint,"encodingByteCount",encodingByteCount,"nextBytes",nextBytes,"decodedBytes",decodedBytes);
        //     // throw new Error("Invalid codepoint");
        // }
        if(!knownCodepoint){ // � can be the result of single bytes or multibyte characters. We will keep only the first one we've seen, but we still need to push forward the index.
            
            fnCharset.map.set(codepoint,nextBytes);
        
        }
       
        dataIndex+=encodingByteCount;
    }
    return decoded;

}



window.dynamicDecoderCharacterCounter2 = function(decoder,fnCharset,bufferData)
{
    console.warn("Using dynamicDecoderCharacterCounter2");
    console.log("The idea was to use find, but it is slower than the for loop");
    
    decoded = decoder.decode(bufferData);

    let splitDecode = Array.from(decoded); // Using Array.from to split the string into an array of characters because multiple bytes are used for some characters, it handles that correctly
    
    let dataIndex=0;
    let charUint8Array = new Uint8Array(bufferData);


    outerLoop: for(let i=0;i<splitDecode.length;i++)
    {   
        let char = splitDecode[i];
        
        let codepoint=char.codePointAt(0); // codePointAt handles surrogate pairs correctly
        let knownCodepoint = fnCharset.map.get(codepoint);
        
        // console.log("\n");

        // if(codepoint==65533)
        // {
        //     console.warn(codepoint,"DataIndex",dataIndex,"Codepoint",codepoint,"char",char,"index",i,"dataIndex",dataIndex,knownCodepoint);
        // }
        

        if((codepoint<=126 || knownCodepoint) && char !="�") // We cant trust the � character, for the number of bytes of the one we have in map  it can be the result of single bytes or multibyte characters.  
        {
            // if(knownCodepoint)
            // {
            //     console.log("Skipping known codepoint",codepoint,"char",char,"index",i,"dataIndex",dataIndex,"knownCodepoint",knownCodepoint);
            // }
            // else
            // {   
            //     console.log("Skipping ASCII character",codepoint,"char",char,"index",i,"dataIndex",dataIndex);
            // }
            let shifting = knownCodepoint ? knownCodepoint.length : 1;
            // let currentNextBytes = charUint8Array.slice(dataIndex,dataIndex+shifting);

            // let currentNextBytesDecoded = decoder.decode(currentNextBytes);
            // console.log("1 Current nextbytes are",currentNextBytes,"and decodes to",currentNextBytesDecoded, "shifting",shifting);
            // if(currentNextBytesDecoded!=char)
            // {
            //     console.error("1 Couldn't find encoding byte count for character",char,"defaultByteCount",1,currentNextBytes,"decodes to",currentNextBytesDecoded);
            //     throw new Error("1 Couldn't find encoding byte count for character");
            // }
            // console.log("Continuing with",char,"index",i,"dataIndex",dataIndex);
            dataIndex+=shifting;
            continue outerLoop;
        }
        let nextBytes = null;
        for(var encodingByteCount of [2,1,3,4]) // Using variable leakage at our advantage, we will keep the last value of encodingByteCount
        {
            nextBytes = charUint8Array.slice(dataIndex,dataIndex+encodingByteCount);
            let nextBytesDecoded =  decoder.decode(nextBytes);
            if(nextBytesDecoded==char){break;}
        }

        if(!encodingByteCount)
        {
            console.error("2 Couldn't find encoding byte count for character",char,"defaultByteCount",encodingByteCount,nextBytes,"decodes to","'"+decoder.decode(nextBytes)+"'");
            throw new Error("2 Couldn't find encoding byte count for character");
        }

        if(!knownCodepoint){ // We must not overwrite the known codepoints, especially for the multiroles characters, they can be the result of single bytes or multibyte characters. Once we know one of them we must not overwrite it.
            fnCharset.map.set(codepoint,nextBytes);
        }
       
        dataIndex+=encodingByteCount;
    }
    return decoded;

}


window.uDarkDecodeEscapeSequence = function(decoder,fnCharset,bufferData) {
    let data=new Uint8Array(bufferData);
    let escapeSequences = splitEscSequences(data);
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


testURLCharset= async (url,charset)=>{
    {
        // Fetch an url
       
        // find out remote encoding via response headers
        let response = await fetch(url);
        
        let data = await response.arrayBuffer();
        let decoder = new TextDecoder(charset);

        data= new Uint8Array(data);
        // data = data.slice(12631,12690);
        console.log("Data",data);

        let decoded = decoder.decode(data);
    
        // Try to decode the data with the charset using our method
        let uDarkDecoded = uDarkDecode(charset,data);
    
        // Try to encode the data with the charset using our method
        let uDarkEncoded = uDarkEncode(charset,uDarkDecoded);
    
        // Check if the original data and the re-encoded data match
        let originalData = new Uint8Array(data);
    

        console.log("Will check byte by byte");
        for(let i=0;i<originalData.length;i++)
        {
            if(originalData[i]!=uDarkEncoded[i])
            {
                mismatch=true;
                  let aroundSize=3;
                let [before,after]=[originalData.slice(i-aroundSize,i+aroundSize),uDarkEncoded.slice(i-aroundSize,i+aroundSize)];
                decodedBefore = decoder.decode(before);
                decodedAfter = decoder.decode(after);
                if(decodedBefore!=decodedAfter)
                {
                    console.warn("BYTES Mismatch at",i,"Original",originalData[i],"Encoded",uDarkEncoded[i],"charset",charset);
                    console.info("If string matches, its probably a multirole char that can be encoded in multiple ways, especially the unknown character �");
                
                    console.log("Bytes around is different",before!=after,"check for multirole char especialy �");
                    console.table({decodedBefore,decodedAfter});
                }
                break;
            }
        }

        // Now uDarkHTMLEntityProtected as a wholde word is a forbidden string in the page, this is why do the concatenation in two steps
        // I never want to see this string in a page ever again.
        
        let myStringVersion = new TextDecoder(charset).decode(uDarkEncoded);

        console.log("Will check char after char:",decoded!=myStringVersion);
        let oChars = Array.from(decoded);
        let eChars = Array.from(myStringVersion);
        if(decoded!=myStringVersion)
        {
            console.error("Decoding/Encoding Mismatch");
            
            console.log("Original",decoded);
            console.log("Decoded",myStringVersion);
        }
        for(let i=0;i<oChars.length;i++)
        {
            if(oChars[i]!=eChars[i])
            {
                let aroundSize=10;
                console.log("STR Mismatch at",i,"Original",oChars[i],"Encoded",eChars[i], "charset",charset);
                let [before,after]=[decoded.slice(i-aroundSize,i+aroundSize),myStringVersion.slice(i-aroundSize,i+aroundSize)];
                console.log("Text around is different",before!=after);
                console.table({before,after});
                break;
            }
        }
    
    
    
    
    }
}
// z("http://charset.7jp.net/mojibake.html","shift_jis");
// testURLCharset("http://charset.7jp.net/sjis.html","shift_jis");
// testURLCharset("http://charset.7jp.net/ascii.cgi","shift_jis");
// testURLCharset("http://charset.7jp.net/ascii.cgi","shift_jis");
// testURLCharset("https://www.hyperhosting.gr/grdomains/","ISO-8859-7");