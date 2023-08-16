from langchain.document_loaders import UnstructuredFileLoader
from langchain.chains.summarize import load_summarize_chain
from langchain import OpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
import sys
import os
from dotenv import load_dotenv

load_dotenv()

path = sys.argv[1]
#step one
loader = UnstructuredFileLoader(path)
document = loader.load()

#step two

llm = OpenAI(openai_api_key=os.getenv('OPENAI_API_KEY'))

#step three
char_text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=0)
docs = char_text_splitter.split_documents(document)

#step four
model = load_summarize_chain(llm=llm, chain_type="refine")
print(model.run(docs))
#print(model)
# Step five
#for output in model.get_output('output_text'):
#    print(output)