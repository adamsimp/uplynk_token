# upLynk Token Generator

###REST API service for upLynk playback token creation
*Available via POST or GET*
* * *
### Usage:

Required params 
 
* ct: a = asset; c = channel  
* cid: GUID(s) of asset(s) or channel(s) from upLynk CMS  
* exp: Token duration (in minutes)  
* key: API Key (from CMS > Playback Tokens) 

Optional Params  

* v:2  include value of 2 if you want preplay URL

Additionally you may pass any other key value pairs needed for playback, such as:  


* ad=ad_server
* ad.preroll=1
* etc

* * *

**POST Example (cUrl):**

```sh
$ curl -X POST -H "Content-Type: application/json" -d '{
     "ct": "a", 
     "cid": "1111","2222","3333"
     "exp": 1, 
     "key": "apikeyapikeyapikeyapike",
     "v": 2 
 }' 'http://morning-meadow-6381.herokuapp.com/token'
```

**POST Example (Python with [Requests](http://docs.python-requests.org/en/latest/user/install/#install)): **  
 
```python
import requests

url = "http://morning-meadow-6381.herokuapp.com/token"

payload = '{"ct": "a","cid": "1111","2222","3333","exp": 1, "key": "12312312","v": 2}'
headers = {
    'content-type': "application/json",
    'cache-control': "no-cache"
    }

response = requests.request("POST", url, data=payload, headers=headers)

print(response.text)
```



**GET example**
```bash
http://morning-meadow-6381.herokuapp.com/token?
ct=a&cid=nnnnnnnnnnnn&exp=1&key=apikeyapikey&v=2
```