from flask import Flask, render_template, request
import json
from bson import json_util
from pymongo import MongoClient
from bson.json_util import dumps
import zipcodeidx

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

@app.route("/crime")
def crime():
	return render_template('crime.html')

@app.route("/expenditure")
def expenditure():
	return render_template('expenditure.html')

@app.route("/median")
def median():
	return render_template('median.html')

@app.route("/traffic")
def traffic():
	return render_template('traffic.html')

@app.route("/data")
def get_data(zip_arg=None, crime=None, status=None, ret_json=True):
	if (zip_arg == None):
		zip_arg = request.args.getlist('zip')
	
	if (crime == None):
		crime = request.args.getlist('crime')

	if (status == None):
		status = request.args.getlist('status')

	zipcode = []
	for entry in zip_arg:
		zipcode.append(int(entry))

	query = [{"$match" : {"GO Location Zip" : { "$in" : zipcode },
		"Highest NIBRS/UCR Offense Description" : { "$in" : crime} } },
		{"$group" : {"_id" : {"GO Location Zip" : "$GO Location Zip"}, "total" : {"$sum" : 1}}}]

	if len(status) < 3:
		if status[0] == "0":
			query[0]["$match"].update({"Clearance Status": { "$in" : [0] }})
		else:
			query[0]["$match"].update({"Clearance Status": { "$nin" : [0] }})
	
	connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
	collection = connection[DBS_NAME][COLLECTION_NAME]
	zip_list = collection.aggregate(pipeline=query)

	crime_dataSet = []

	for i in range(0, 47):
		crime_dataSet.append(0)
	
	total_crimes = 0

	for row in zip_list:
		crime_dataSet[zipcodeidx.zipcodeindex[row["_id"]["GO Location Zip"]] - 1] = row["total"]
		total_crimes += row["total"]
		
	crime_dataSet.append(total_crimes)

	connection.close()
	# print(json.dumps(crime_dataSet))
	# print(crime_dataSet)
	if (ret_json):
		return json.dumps(crime_dataSet)
	else:
		return crime_dataSet

@app.route("/cpack_data")
def get_solve_crime():
	zip_arg = request.args.getlist('zip')
	crime = request.args.getlist('crime')
	# print("crime1")
	# print(crime)

	zipcode = []
	
	for entry in zip_arg:
		zipcode.append(int(entry))

	query = [{"$match" : {"GO Location Zip" : { "$in" : zipcode },
		"Clearance Status" : { "$nin" : [0] } } },
		{"$group" : {"_id" : {"GO Location Zip" : "$GO Location Zip",
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
		# print("crimename")
		# print(eachCrime["name"])
		eachCrime["children"] = []

		projects = collection.aggregate(pipeline=query)

		for row in projects:
			if row["_id"]["GO Location Zip"] in zipcode:
				report_date = row["_id"]["Report Day"]
				clear_date = row["_id"]["Clearance Day"]
				time_to_clear = clear_date - report_date
				timeStatus = returnSolveDurationStatus(time_to_clear)
				idx = findIdxofName(eachCrime["children"], timeStatus)
				# print("idx")
				# print(idx)
				# print(timeStatus)

				if idx == -1:
					solveCategory = dict()
					solveCategory["name"] = timeStatus
					solveCategory["children"] = []
					eachCrime["children"].append(solveCategory)
					idx = len(eachCrime["children"]) - 1
					
				
				cidx = findIdxofName(eachCrime["children"][idx]["children"], \
					str(row["_id"]["GO Location Zip"]))
				# print("cdx")
				# print(cidx)
				
				if cidx == -1:
					crimeSolved = dict()
					crimeSolved["name"] = str(row["_id"]["GO Location Zip"])
					crimeSolved["total"] = 0
					eachCrime["children"][idx]["children"].append(crimeSolved)
					cidx = len(eachCrime["children"][idx]["children"]) - 1
					
					
				eachCrime["children"][idx]["children"][cidx]["total"] += 1

		
		result["children"].append(eachCrime)

	connection.close()

	# print(json.dumps(result))
	return json.dumps(result)
	
def returnSolveDurationStatus(val):
	if val <= 30:
		return "Under 30 days"
	if val <= 90:
		return "Between 1 and 3 Months"
	if val <= 180:
		return "Between 3 and 6 Months"
	if val <= 365:
		return "Between 6 Months and a Year"

def findIdxofName(arr, val):
	for i in range(0, len(arr)):
		if arr[i]["name"] == val:
			return i
	return -1

@app.route("/tot_crime_data")
def get_tot_crime():
	zip_arg = request.args.getlist('zip')
	crime = request.args.getlist('crime')
	status = request.args.getlist('status')
	# print("crime2")
	# print(crime)
	result = dict()

	for i in crime:
		result[i] = get_data(zip_arg, [i], status, False)

	# print(json.dumps(result))
	return json.dumps(result)

if __name__ == "__main__":
    app.run(host='localhost',debug=False)





