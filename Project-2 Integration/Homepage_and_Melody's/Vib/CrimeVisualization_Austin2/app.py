from flask import Flask, render_template, request
import json
from bson import json_util
from pymongo import MongoClient
from bson.json_util import dumps

app = Flask(__name__)

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'austinCrimeStats'
COLLECTION_NAME = 'projects'
FIELDS ={'Council District': True , 'GO Highest Offense Desc' : True,
		'Highest NIBRS/UCR Offense Description' : True , 'GO Report Date' : True ,
		'Report Day' : True,'GO Location' : True,'Clearance Status' : True,
		'Clearance Date' : True , 'Clearance Day' : True , 'GO District' : True ,
		'GO Location Zip' : True, 'GO Census Tract' : True , 'GO X Coordinate' : True ,
		'GO Y Coordinate' : True , '_id': False}
	

@app.route("/")
def index():
	return render_template("index.html")

@app.route("/data")
def get_data(council_arg=None, crime=None, status=None, ret_json=True):
	if (council_arg == None):
		council_arg = request.args.getlist('council')
	
	if (crime == None):
		crime = request.args.getlist('crime')

	if (status == None):
		status = request.args.getlist('status')

	council = []
	for entry in council_arg:
		council.append(int(entry))

	query = [{"$match" : {"Council District" : { "$in" : council },
		"Highest NIBRS/UCR Offense Description" : { "$in" : crime} } },
		{"$group" : {"_id" : {"Council District" : "$Council District"}, "total" : {"$sum" : 1}}}]

	if len(status) < 3:
		if status[0] == "0":
			query[0]["$match"].update({"Clearance Status": { "$in" : [0] }})
		else:
			query[0]["$match"].update({"Clearance Status": { "$nin" : [0] }})
	
	connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
	collection = connection[DBS_NAME][COLLECTION_NAME]
	council_list = collection.aggregate(pipeline=query)

	crime_dataSet = []

	for i in range(0, 10):
		crime_dataSet.append(0)
	
	total_crimes = 0

	for row in council_list:
		crime_dataSet[row["_id"]["Council District"] - 1] = row["total"]
		total_crimes += row["total"]
		
	crime_dataSet.append(total_crimes)

	connection.close()
	if (ret_json):
		return json.dumps(crime_dataSet)
	else:
		return crime_dataSet

@app.route("/cpack_data")
def get_solve_crime():
	council_arg = request.args.getlist('council')
	crime = request.args.getlist('crime')

	council = []
	# solveRange = ["<=30 days", ">30 days and <=90 days", ">90 days and <=180 days",
	# 	">180 days and <=365 days"]
	
	for entry in council_arg:
		council.append(int(entry))

	query = [{"$match" : {"Council District" : { "$in" : council },
		"Clearance Status" : { "$nin" : [0] } } },
		{"$group" : {"_id" : {"Council District" : "$Council District",
		"Highest NIBRS/UCR Offense Description" : "$Highest NIBRS/UCR Offense Description",
		"Report Day" : "$Report Day", "Clearance Day" : "$Clearance Day"}}}]
	
	connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
	collection = connection[DBS_NAME][COLLECTION_NAME]
	result = dict()
	result["name"] = "Crime"
	result["children"] = []

	for i in range(0, len(crime)):
		if (i == 0):
			query[0]["$match"].update({"Highest NIBRS/UCR Offense Description": { "$in" : [crime[i]] }})
		else:
			query[0]["$match"]["Highest NIBRS/UCR Offense Description"]["$in"] = [crime[i]]
		
		eachCrime = dict()
		eachCrime["name"] = crime[i]
		eachCrime["children"] = []

		projects = collection.aggregate(pipeline=query)

		for row in projects:
			if row["_id"]["Council District"] in council:
				report_date = row["_id"]["Report Day"]
				clear_date = row["_id"]["Clearance Day"]
				time_to_clear = clear_date - report_date
				timeStatus = returnSolveDurationStatus(time_to_clear)

				idx = findIdxofName(eachCrime["children"], timeStatus)

				if idx == -1:
					solveCategory = dict()
					solveCategory["name"] = timeStatus
					solveCategory["children"] = []
					eachCrime["children"].append(solveCategory)
					idx = len(eachCrime["children"]) - 1
					
				
				cidx = findIdxofName(eachCrime["children"][idx]["children"], "Council #" +\
					str(row["_id"]["Council District"]))
				
				if cidx == -1:
					crimeSolved = dict()
					crimeSolved["name"] = "Council #" + str(row["_id"]["Council District"])
					crimeSolved["total"] = 0
					eachCrime["children"][idx]["children"].append(crimeSolved)
					cidx = len(eachCrime["children"][idx]["children"]) - 1
					
					
				eachCrime["children"][idx]["children"][cidx]["total"] += 1

		
		result["children"].append(eachCrime)

	connection.close()
	return json.dumps(result)
	
def returnSolveDurationStatus(val):
	if val <= 30:
		return "<=30 days"
	if val <= 90:
		return ">30 days and <=90 days"
	if val <= 180:
		return ">90 days and <=180 days"
	if val <= 365:
		return ">180 days and <=365 days"

def findIdxofName(arr, val):
	for i in range(0, len(arr)):
		if arr[i]["name"] == val:
			return i

	return -1

@app.route("/tot_crime_data")
def get_tot_crime():
	council_arg = request.args.getlist('council')
	crime = request.args.getlist('crime')
	status = request.args.getlist('status')

	result = dict()

	for i in crime:
		result[i] = get_data(council_arg, [i], status, False)
	return json.dumps(result)

if __name__ == "__main__":
    app.run(host='localhost',debug=True)





