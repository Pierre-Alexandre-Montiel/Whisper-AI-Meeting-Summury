import { Configuration, OpenAIApi } from "openai";
import fs from "fs";
import formidable from "formidable";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { loadSummarizationChain } from "langchain/chains";
import { OpenAI } from "langchain/llms";
import { PromptTemplate } from "langchain/prompts";
const {PythonShell} =require("python-shell");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }
  const form = new formidable.IncomingForm({filename: (name, ext, part, form) => part.originalFilename});
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      res.status(500).json({
        error: {
          message: 'An error occurred during your parsing',
        }
      });
      return;
    }
    try {
      
      //console.log(files.file)
/*       let result;
      let newpath;
      if (fields.path)
        newpath = fields.path;
      else {
        newpath = `${files.file.filepath}.mp3` 
        fs.rename(files.file.filepath, newpath,()=>{})
      }
      const stream = fs.createReadStream(newpath);
      let prompt;
      let language; 
      fields.prompt ? prompt = fields.prompt : null;
      fields.inputLanguage ? language = fields.inputLanguage : null;
      if (fields.action === 'transcript')
        result = await openai.createTranscription(stream, "whisper-1", prompt, 'text', 0.2, language);
      else if (fields.action === 'translate') {
        result = await openai.createTranslation(stream, 'whisper-1', undefined, 'text', 0.2);
      } */
      //res.status(200).json({ result: result.data, path: newpath, action: fields.action});
      //const newpath = `${files.file.filepath}${files.file.originalFilename.substr(files.file.originalFilename.lastIndexOf('.'))}`;
      //fs.rename(files.file.filepath, newpath,()=>{})
      //console.log(newpath)
      //files.file.filepath
      const stream = fs.createReadStream(files.file.filepath);
      openai.axios.defaults.maxBodyLength = Infinity;
      openai.axios.defaults.maxContentLength = Infinity;
      console.time();
      console.log("transcription begin")
      const result =  await openai.createTranslation(stream, "whisper-1", undefined, 'text', 0.2);
      console.timeLog();
      const model = new OpenAI({ temperature: 0.6 });
      const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 2000 });
      console.log(textSplitter);
      console.timeLog();
      const docs = await textSplitter.createDocuments([result.data]);
      console.timeLog()
      const template = 'Write a detailled summary of the following:\n' + '\n' + '\n' + '"{text}"\n' + '\n' + '\n' + 'CONCISE SUMMARY:'

      const prompt = new PromptTemplate({
        template:  template,
        inputVariables: ["text"],
      });
      /* template: 'Write a concise summary of the following:\n' +
      '\n' +
      '\n' +
      '"{text}"\n' +
      '\n' +
      '\n' +
      'CONCISE SUMMARY:' */
      const chain = loadSummarizationChain(model, {    prompt: prompt,
        combineMapPrompt: prompt,
        combinePrompt: prompt,
        type: "map_reduce"});
      console.timeLog();
      console.log('transcription finish... Start recursion ....')
    
      const out = await chain.call({
        input_documents: docs,
      });
      console.log(chain, 'OUT', out);
      console.timeLog();
      console.log("FINISH")

      res.status(200).json({translate: result.data, resumate: out.text});
      try {
        fs.writeFileSync('C:/Users/p.a.montiel/Sum_app/Whisper_translate_summarize_wepapp/dataset/transcript.txt', result.data);
      } catch (err) {
        console.error(err);
      }
      let options = {
        mode: "text",
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: "C:/Users/p.a.montiel/Sum_app/Whisper_translate_summarize_wepapp/services",
        args: ["C:/Users/p.a.montiel/Sum_app/Whisper_translate_summarize_wepapp/dataset/transcript.txt"],
      };

      let pyshell = new PythonShell("tokenizer.py", options);
      pyshell.send();
      pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        console.log("MESSAGE = ", message);
      });
      pyshell.end(function (err,code,signal) {
        if (err) throw err;
        console.log('The exit code was: ' + code);
        console.log('The exit signal was: ' + signal);
        console.log('finished');
      });
    } catch (error) {
      if (error.response) {
        console.error(error.response.status, error.response.data);
        res.status(error.response.status).json(error.response.data);
      } else {
        console.error(`${error.message}`);
        res.status(500).json({
          error: {
            message: 'An error occurred during your request.',
          }
        });
      }
    }
  });
}
