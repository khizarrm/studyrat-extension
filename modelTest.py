#initial basic testing. gets page from urls and sends relevant info into chat to check if
#study related or not 
from selenium import webdriver  # launches Chrome browser
from selenium.webdriver.chrome.options import Options  # allows for browser configuration
from bs4 import BeautifulSoup  # makes HTML parsing easier
from dotenv import load_dotenv  # loads environment variables from .env file
import os
from openai import OpenAI  # OpenAI SDK

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

def getData(url):
    options = Options()
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    driver = webdriver.Chrome(options=options)
    driver.get(url)
    driver.implicitly_wait(10)
    page_source = driver.page_source
    driver.quit()
    return page_source

def sendPrompt(source, url):
    soup = BeautifulSoup(source, 'html.parser')
    headings = [tag.get_text(strip=True) for tag in soup.find_all(['title', 'h1', 'h2', 'h3'])]
    page_summary = "\n".join(headings)
    page_summary += url
    client = OpenAI(api_key=api_key)
    print(page_summary)
    topic = ""
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
            "role": "system",
            "content": "You are a helpful assistant that determines if a webpage is primarily related to productive or educational content (e.g. tutorials, learning resources, technical discussions, job listings, or communities focused on improving skills), or if it is mostly entertainment/brain rot (e.g. memes, gossip, celebrity news, low-effort content). If the content includes technical topics, professional development, or learning-related discussions—even if from Reddit—consider it educational. Based on this, return just the word 'yes' if it's educational/productive, or 'no' if it's not."
            },
            {"role": "user", "content": f"Is this webpage about studying or educational content?\n\n{page_summary}"}
        ]
    )

    return response.choices[0].message.content.strip()

#testing
study_urls = [
    "https://www.khanacademy.org/math/linear-algebra",
    "https://www.coursera.org/learn/machine-learning",
    "https://realpython.com/python-web-scraping-practical-introduction/",
    "https://en.wikipedia.org/wiki/Neural_network",
    "https://www.codecademy.com/learn/learn-python-3"
]

non_study_urls = [
    "https://www.w3schools.com/python/python_functions.asp"
]

for url in non_study_urls:
    print(f"Checking URL: {url}")
    page_source = getData(url)
    result = sendPrompt(page_source, url)
    print(f"Result: {result}\n")



