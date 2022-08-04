
import sys
import statistics
import math
import mysql.connector
import datetime
import time
import pandas as pd
import numpy as np
import asyncio
from sklearn.metrics.pairwise import cosine_similarity
from scipy import sparse


start_time = time.time()
mydb = mysql.connector.connect(
  host     = '127.0.0.1',
  user     = 'root',
  password = '',
  database = 'cityu_fyp',
)


# user_id = sys.argv[1]
# type_id = sys.argv[2].split(',')
# settlement_type = sys.argv[3].split(',')
# places = sys.argv[4].split(',')
# tags = sys.argv[5].split(',')
# serach_time = sys.argv[6]

user_id = '1'
type_id = ['0']
settlement_type = ['0']
places = ['0']
tags = ['0']
serach_time = '3'

search_like_sql = ""
search_view_sql = ""
search_post_sql = ""

def get_day_before(day):
    n_day = day
    today = datetime.datetime.now()
    n_days_before = datetime.timedelta(days = n_day)
    day_before = str(today - n_days_before)
    day_before = day_before.split()[0]
    return day_before


def get_next_day():
    today = datetime.datetime.now()
    #today = datetime.datetime(2022, 7, 5)
    next_day = str(today+ datetime.timedelta(days=1))
    return next_day.split()[0]

day_before = ''
serach_day = -1
is_hour = False
if serach_time != '0':
    if serach_time == '1':
        serach_day = 1
        is_hour = True
        day_before = get_day_before(1)
    elif serach_time == '2':
        serach_day = 7
        day_before = get_day_before(7)
    elif serach_time == '3':
        serach_day = 30
        day_before = get_day_before(30)
    search_like_sql = " AND Date(pl.create_date) > \"" + str(day_before) + "\" "
    search_view_sql = " AND Date(pvr.start_from) > \"" + str(day_before) + "\" "
    search_post_sql = " AND Date(post.create_date) > \"" + str(day_before) + "\" "
else:
    serach_day = 730

mycursor = mydb.cursor(buffered=True)

mycursor.execute("SELECT post.*,pt.name AS type,user.name AS posterName, (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id AND pl.status = 1 " + search_like_sql + " ) AS likedNumber , (Select COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = post.id AND pvr.user_id != post.created_by "+ search_post_sql +" ) AS visitedNumber, ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id WHERE post.status = 1 " + search_post_sql)

results = mycursor.fetchall()

mycursor.execute("SELECT COUNT(id) FROM post_type WHERE status = 1")

types_number = mycursor.fetchall()[0][0]

mycursor.execute("SELECT COUNT(id) FROM post_settlement_type WHERE status = 1")

settlement_number = mycursor.fetchall()[0][0]

mycursor.execute("SELECT COUNT(id) FROM district")

district_number = mycursor.fetchall()[0][0]

mycursor.execute("SELECT COUNT(id) FROM region")

region_number = mycursor.fetchall()[0][0]

mycursor.execute("SELECT COUNT(id) FROM post_tag WHERE status = 1")

tag_number = mycursor.fetchall()[0][0]

df = pd.DataFrame(data = results,columns=['id','name','content','type_id','created_by','create_date','others','status','type','posterName','liked_number','viewed_number','sTypeID','settlementID','settlementName'])

viewed_count = sum(df[df['viewed_number'].notnull()]['viewed_number'].astype('int'))
liked_count = sum(df[df['liked_number'].notnull()]['liked_number'].astype('int'))
average_view = df['viewed_number'].mean()
average_like = df['liked_number'].mean()

for index, row in df.iterrows():
    df.loc[index,'create_date'] = int(time.mktime(row["create_date"].timetuple()))

submitted_type_list = [0 for i in range(types_number)]

if type_id[0] != '0':
    for id in type_id:
        submitted_type_list[int(id)-1] = 1
elif type_id[0] == '0':
    submitted_type_list = [1 for i in range(types_number)]

submitted_settlement_list = [0 for i in range(settlement_number)]
submitted_district_value = [0 for i in range(district_number)]
submitted_region_value = [0 for i in range(region_number)]
if settlement_type[0] != '0':
    for id in settlement_type:
        submitted_settlement_list[int(id)-1] = 1
        if id == '1':
            for district in places:
                submitted_district_value[int(district)-1] = 1
                mycursor.execute("SELECT region_id FROM district where id = %s",[str(district)])
                districts = mycursor.fetchall()
                submitted_region_value[districts[0][0]-1] = submitted_region_value[districts[0][0]-1] + 1
elif settlement_type[0] == '0':
    if places[0] == '0':
        submitted_settlement_list = [1 for i in range(settlement_number)]
        submitted_district_value = [1 for i in range(district_number)]
        submitted_region_value = [1 for i in range(region_number)]
    else: 
         submitted_settlement_list = [1 for i in range(settlement_number)]
         for district in places:
            submitted_district_value[int(district)-1] = 1
            mycursor.execute("SELECT region_id FROM district where id = %s",[str(district)])
            districts = mycursor.fetchall()
            submitted_region_value[districts[0][0]-1] = submitted_region_value[districts[0][0]-1] + 1

submitted_tag_value = [0 for i in range(tag_number)]

if tags[0] != '0':
    for id in tags:
        submitted_tag_value[int(id)-1] = 1
elif tags[0] == '0':
    submitted_tag_value = [1 for i in range(tag_number)]

submitted_value = np.array([submitted_type_list+submitted_settlement_list+submitted_district_value+submitted_region_value+submitted_tag_value])
result = []
def get_similiarity_score():
    for index, row in df.iterrows():
        type_list = [0 for i in range(types_number)]
        settlement_list =[0 for i in range(settlement_number)]
        type_list[df.loc[index,'type_id']-1] = 1
        district_value = [0 for i in range(district_number)]
        region_value = [0 for i in range(region_number)]
        tag_value = [0 for i in range(tag_number)]
        if df.loc[index,'sTypeID'] == 1:
            mycursor.execute("SELECT psp.district_id,district.region_id FROM post_settlement_place psp INNER JOIN district ON psp.district_id = district.id WHERE psp.settlement_id = %s",[str(df.loc[index,'settlementID'])])
            districts = mycursor.fetchall()
            for district in districts:
                district_value[district[0]-1] = 1
                region_value[district[1]-1] = region_value[district[1]-1] + 1
        mycursor.execute("SELECT tag_id FROM post_saving_tag WHERE post_id = %s",[str(df.loc[index,'id'])])
        result_tags = mycursor.fetchall()
        for tag in result_tags:
            tag_value[tag[0]-1] = 1
        compare_value =  np.array([(type_list+settlement_list+district_value+region_value+tag_value)])
        score = (index,cosine_similarity(submitted_value,compare_value)[0][0])
        result.append(score)




get_similiarity_score()


names = df['name']
indices = pd.Series(df.index, index=df['name'])


def get_post_like_and_view_each_day(post_id):
    minday = maxday = serach_day
    likes = []
    views = []
    if is_hour:
        for i in range (24):
            if i < 10 : 
                ma_day = "" + get_day_before(0) + " 0"+ str(i) +":00:00"
                if i == 9:
                    mi_day = "" + get_day_before(0) + " " + str(int(i+1))  + ":00:00"
                else:
                    mi_day = "" + get_day_before(0) + " 0" + str(int(i)+1)  + ":00:00"
            else:
                ma_day = "" + get_day_before(0) + " " + str(i) +":00:00"
                if i == 23:
                    mi_day = "" + get_next_day() + " 00"+":00:00"
                else:
                    mi_day = "" + get_day_before(0) + " " + str(int(i+1)) +":00:00"
           
            mycursor.execute("SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = %s AND pl.status = 1 AND pl.create_date >= %s AND pl.create_date < %s",[post_id,ma_day,mi_day])
            result_likes = mycursor.fetchall()
            mycursor.execute("SELECT COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = %s AND pvr.start_from >= %s AND pvr.start_from < %s",[post_id,ma_day,mi_day])
            result_views = mycursor.fetchall()
            likes.append(result_likes[0][0])
            views.append(result_views[0][0])
    else:
        for i in range (serach_day):
            ma_day = get_day_before(maxday - i)
            mi_day = get_day_before(maxday -i -1)
            mycursor.execute("SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = %s AND pl.status = 1 AND pl.create_date >= %s AND pl.create_date < %s",[post_id,ma_day,mi_day])
            result_likes = mycursor.fetchall()
            mycursor.execute("SELECT COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = %s AND pvr.start_from >= %s AND pvr.start_from < %s",[post_id,ma_day,mi_day])
            result_views = mycursor.fetchall()
            likes.append(result_likes[0][0])
            views.append(result_views[0][0])
        
    return likes,views


def get_most_popular_peroid(target_list):
    mean_of_list = statistics.mean(target_list)
    max_value =  float('-inf')
    max_subarray = [0]
    for i in range(len(target_list)):
        current_subarray = []
        current_value  = 0 
        for y in range(i,len(target_list),1):
            current_value = current_value + target_list[y] - mean_of_list
            if current_value >= max_value:
                max_value = current_value
                current_subarray.append(y)
                max_subarray = current_subarray
    return max_subarray,max_value



def weighted_rating(x):
    m = x.count()

    likes,views = get_post_like_and_view_each_day(x['id'])
    view_period,view_count = get_most_popular_peroid(views)
    like_period,like_count = get_most_popular_peroid(likes)
    
    view_period = view_period[-1]+1
    like_period = like_period[-1]+1

    if view_count == 0:
        view_period = 1
    if like_count == 0:
        like_period = 1   
        
    if is_hour:
        v = x['liked_number'] * (like_period)/24
        r = x['viewed_number'] * (view_period)/24
    else:
        v = x['liked_number'] * (like_period)/serach_day
        r = x['viewed_number'] * (view_period)/serach_day

    if v == 0 and r != 0:
        return (r/viewed_count * average_view)
    elif v != 0 and r == 0:
        return (v/liked_count * average_like)
    elif v== 0 and r ==0:
        return 0
    else: 
        return ((v/liked_count) * average_like)  + ((r/viewed_count) * average_view)

def get_recommendations_with_feature_weigthing():
    sim_scores = sorted(np.array(result), key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:31]
    post_indices = [i[0] for i in sim_scores]
    names.iloc[post_indices]
    post = df.iloc[post_indices][['id','name','content','type_id','created_by','create_date','others','status','type','posterName','liked_number','viewed_number','sTypeID','settlementID','settlementName']]

    reommend_post = post
    reommend_post['viewed_number'] = reommend_post['viewed_number'].astype('int')
    reommend_post['liked_number'] = reommend_post['liked_number'].astype('int')
    reommend_post['rating'] = reommend_post.apply(weighted_rating, axis=1)
    reommend_post = reommend_post.sort_values('rating', ascending=False).head(10)
    return reommend_post



result = get_recommendations_with_feature_weigthing()
# print(result.to_json())
sys.stdout.flush()




