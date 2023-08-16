import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import { Box, Flex, Heading,  Button, ButtonGroup, Tabs, TabList, TabPanels, Tab, TabPanel, Text, Input, Stack, InputGroup, SelectField, Center, Alert, AlertIcon, Spinner, CircularProgress, SimpleGrid } from '@chakra-ui/react'

const mimeType = "audio/mpeg";
const acceptedFormats = [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"];
const maxSize = 24000000;

function AudioRecorder ({setFile}) {
  const [permission, setPermission] = useState(false);
  const mediaRecorder = useRef(null);
  const [recordingStatus, setRecordingStatus] = useState("inactive");
  const [stream, setStream] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audio, setAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  useEffect(() => {
    setFile(null);
  }, [])

  const startRecording = async () => {
    setRecordingStatus("recording");
    //create new Medi;a recorder instance using the stream
    const media = new MediaRecorder(stream, { type: mimeType });
    //set the MediaRecorder instance to the mediaRecorder ref
    mediaRecorder.current = media;
    //invokes the start method to start the recording process
    mediaRecorder.current.start();
    let localAudioChunks = [];
    mediaRecorder.current.ondataavailable = (event) => {
       if (typeof event.data === "undefined") return;
       if (event.data.size === 0) return;
       localAudioChunks.push(event.data);
    };
    setAudioChunks(localAudioChunks);
  };

  const clear = () => {
    setAudio(null);
    setAudioChunks([]);
    setAudioBlob(null);
    setFile(null);
  }
  const getMicrophonePermission = async () => {
      if ("MediaRecorder" in window) {
          try {
              const streamData = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                  video: false,
              });
              setPermission(true);
              setStream(streamData);
          } catch (err) {
              alert(err.message);
          }
      } else {
          alert("The MediaRecorder API is not supported in your browser.");
      }
  };

  const stopRecording = () => {
    setRecordingStatus("inactive");
    //stops the recording instance
    mediaRecorder.current.stop();
    mediaRecorder.current.onstop = () => {
      //creates a blob file from the audiochunks data
       const blob = new Blob(audioChunks, { type: mimeType });
      //creates a playable URL from the blob file.
       const audioUrl = URL.createObjectURL(blob);
       const file =  new File([blob], 'voice.mp3', {type: 'audio/mp3'});
       setAudio(audioUrl);
       setFile( file);
       setAudioChunks([]);
    };
  };

  return (
    <Box width='100%' py={4} mb={1}>
        <Flex alignItems='center' justifyContent='center'>
          <Heading as='h1' size='md' >Record audio</Heading>
        </Flex>
        <Flex m={2} p={1}  alignItems='center' justifyContent='center'>
          {!permission ? (
            <Button size='sm' onClick={getMicrophonePermission} type="Button">
                Get Microphone
            </Button>
          ) : null}
          {permission && recordingStatus === "inactive" ? (
          <Button size='sm' onClick={startRecording} type="Button">
              Start Recording
          </Button>
          ) : null}
          {recordingStatus === "recording" ? (
            <Button  size='sm' onClick={stopRecording} type="Button">
                Stop Recording
            </Button>
          ) : null}
        </Flex>
        {audio ? (
            <Flex  alignItems='center' justifyContent='center'> 
              <audio src={audio} controls></audio>
              <Button size='sm' onClick={clear} mx={3} colorScheme='red' type="Button"> Clear</Button>
            </Flex>
          ) : null}
    </Box>
  )
}

function  AudioUploader({setFile}){
  const [alert, setAlert] = useState(null);
  const inputRef= useRef(null);
 
  useEffect(() => {
    setFile(null);
  }, [])
  
  const test = (event) => {
    const file = inputRef.current.files[0]
    if (file) {
      let indexPoint = file.name.lastIndexOf('.');
      if (file.size > maxSize) {
        setAlert({status: 'error', message: 'File too large (max 24mb)'});
        setFile(null)
      }
      else if (indexPoint == -1 || !acceptedFormats.includes(file.name.substr(indexPoint))) {
        setAlert({status: 'error', message: 'Bad format file'});
        setFile(null)
      }
      else {
        setAlert({status: 'success', message: 'Correct format file'})
        setFile(file)
      }
    }
  }

  return (
    <Box  width='100%' py={4} mb={1}>
      <Flex  alignItems='center' justifyContent='center'>
        <Heading as='h1' size='md' mb={4}>Upload mp3, mp4, mpeg, mpga, m4a, wav, and webm</Heading>
      </Flex>
      <Flex  alignItems='center' justifyContent='center'>
        <input onInput={test} border='none'type='file' ref={inputRef}/>
      </Flex>
      {alert ?
       <Flex py={2} alignItems='center' justifyContent='center'>
            <Alert width='50%' borderRadius={4} status={alert.status}>
          <AlertIcon />
          {alert.message}  
        </Alert>
       </Flex>
      
      : null}
    </Box>
    
  );
}

function  TabsEl({setFile}) {
  return (
    <Tabs isLazy variant='soft-rounded' isFitted colorScheme='green'>
      <TabList>
        <Tab>Record Audio</Tab>
        <Tab>Upload Audio</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <AudioRecorder setFile={setFile}/>
        </TabPanel>
        <TabPanel>
          <AudioUploader setFile={setFile}/>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

export  default function Home () {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function startRequest(event, action) {
    event.preventDefault();
    try {
        setLoading(true);
        const form = new FormData();
        form.append('file', file);
        try {
          const response = await fetch("/api/whisper_transform", {
            method: "POST",
            body: form
          })
          const data = await response.json();
          if (response.status !== 200) {
            throw data.error || new Error(`Request failed with status ${response.status}`);
          }
          setLoading(false);
          setResult(data);
          setFile(null);
        } catch (error) {
          console.log(error)
          alert(error.message)
          setLoading(false);
          setFile(null);
        }
       
      }
     /* 
      const response = await fetch("/api/whisper_transform", {
        method: "POST",
        body: form
      })
      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      } */

    catch(error) {
      console.error(error);
      alert(error.message);
    }     
  }
  return (
    <Box alignItems='center' width='100wh' height='100vh' py={4}>   
      <Flex  mb={5} alignItems='center' justifyContent='center'>
          <Heading>ACCENTURE TRANSLATE AND SUMMARIZE APP</Heading>
      </Flex>
      {!loading && !result ? 
        <TabsEl setFile={setFile}/> : loading && !result ?
        <Flex  py={10} alignItems='center' justifyContent='center'>
          <CircularProgress size='3em' valueText='Please Wait...' my={4} isIndeterminate color='green.300' />
        </Flex> : !loading && result ?
    

       
        <Stack border='2 px solid black' direction={['column', 'row']}>
          <Text align='text-center' maxWidth='lg' maxHeight='100%'  border='1px solid blue'  overflowY='scroll' p={3} mx={2}>{result.translate}</Text>
          <Text align='text-center' maxWidth='lg'  maxHeight='sm' border='1px solid blue'  overflowY='scroll' p={3} mx={2}>{result.resumate}</Text>
        </Stack>
  
        : null
      }
      {file && !loading ? (
        <Flex  alignItems='center' justifyContent='center'>
          <Button onClick={startRequest} colorScheme="blue">TRANSLATE AND SUMMARIZE</Button>
        </Flex>
      ) : null}
    </Box>
  )
}

/* 
export default function AudioRecorder ()  {
    const [permission, setPermission] = useState(false);
    const mediaRecorder = useRef(null);
    const [recordingStatus, setRecordingStatus] = useState("inactive");
    const [stream, setStream] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [audio, setAudio] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [path, setPath] = useState(null);
    const [transcript, setTranscript] = useState(null);
    const [translate, setTranslate] = useState(null);
    const [inputLanguage, setInputLanguage] = useState(null)
    const ref = useRef(null)

    const startRecording = async () => {
      setRecordingStatus("recording");
      //create new Medi;a recorder instance using the stream
      const media = new MediaRecorder(stream, { type: mimeType });
      //set the MediaRecorder instance to the mediaRecorder ref
      mediaRecorder.current = media;
      //invokes the start method to start the recording process
      mediaRecorder.current.start();
      let localAudioChunks = [];
      mediaRecorder.current.ondataavailable = (event) => {
         if (typeof event.data === "undefined") return;
         if (event.data.size === 0) return;
         localAudioChunks.push(event.data);
      };
      setAudioChunks(localAudioChunks);
    };

    const clear = () => {
      setAudio(null);
      setPath(null);
      setAudioChunks([]);
      setAudioBlob(null);
      setTranscript(null);
      setTranslate(null);
    }
    const getMicrophonePermission = async () => {
        if ("MediaRecorder" in window) {
            try {
                const streamData = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                });
                setPermission(true);
                setStream(streamData);
            } catch (err) {
                alert(err.message);
            }
        } else {
            alert("The MediaRecorder API is not supported in your browser.");
        }
    };

    const stopRecording = () => {
      setRecordingStatus("inactive");
      //stops the recording instance
      mediaRecorder.current.stop();
      mediaRecorder.current.onstop = () => {
        //creates a blob file from the audiochunks data
         const blob = new Blob(audioChunks, { type: mimeType });
        //creates a playable URL from the blob file.
         setAudioBlob(blob);
         const audioUrl = URL.createObjectURL(blob);
         setAudio(audioUrl);
         setAudioChunks([]);
         setPath(null);
      };
    };

    async function startRequest(event, action) {
      event.preventDefault();
      try {
        const form = new FormData();
        if (!path) {
          const audioFile = new File([audioBlob], 'voice.mp3', {type: 'audio/mp3'});
          form.append('file', audioFile);
        }
        else
          form.append('path', path);
        form.append('prompt', ref.current.value.trim());
        form.append('action', action);
        if (action === 'transcript' && inputLanguage)
          form.append('inputLanguage', inputLanguage)
        const response = await fetch("/api/whisper_transform", {
          method: "POST",
          body: form
        })
        const data = await response.json();
        if (response.status !== 200) {
          throw data.error || new Error(`Request failed with status ${response.status}`);
        }
        if (data.action === 'transcript')
          setTranscript(data.result);
        else
          setTranslate(data.result);
        if (data.path)
          setPath(data.path);
      }catch(error) {
        console.error(error);
        alert(error.message);
      }     
    }
    return (
        <div>
            <h2>Audio Recorder</h2>
            <main>
              <div className="audio-controls">
                {audio ? (
                  <button onClick={clear} type="button">
                    Clear all
                  </button>
                ): null
                }
                {!permission ? (
                <button onClick={getMicrophonePermission} type="button">
                    Get Microphone
                </button>
                ) : null}
                {permission && recordingStatus === "inactive" ? (
                <button onClick={startRecording} type="button">
                    Start Recording
                </button>
                ) : null}
                {recordingStatus === "recording" ? (
                <button onClick={stopRecording} type="button">
                    Stop Recording
                </button>
                ) : null
                }
                
              </div>
              { audio ?
                <>
                  <input ref={ref} type="text" placeholder="guide the model's style"/>
                  <button type="button" onClick={(e)=>{e.preventDefault();ref.current.value=''}}>Clear text</button>              
                </>
              : null}
              {audio ? (
                <div className="audio-container">
                  <audio src={audio} controls></audio>
                </div>
              ) : null}
            </main>
            {audio ? (
              <> 
                <div>
                  <select defaultValue="" onChange={e => setInputLanguage(e.target.value)}>
                    <option value="">none</option>
                    {languages.map(el => <option value = {el.code}>{el.language}</option>)}
                  </select>
                  <button onClick={(e) => startRequest(e, 'transcript')} type="button">
                    Transcript
                  </button>
                </div>
                <button onClick={(e) => startRequest(e, 'translate')} type="button">
                  Translate
                </button> 
              </>
            ) : null}
            {transcript ? (
              <>
                <h3>transcript:</h3>
                <div className={styles.result}>{transcript}</div>
              </>
            ) : null}
            {translate ? (
              <>
                <h3>translate:</h3>
                <div className={styles.result}>{translate}</div>
              </>
            ) : null}
            
        </div>
    );
}; */