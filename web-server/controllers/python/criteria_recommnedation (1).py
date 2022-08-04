#!/usr/bin/env python
# coding: utf-8

# In[1]:


import mysql.connector
import datetime
import time


# In[2]:


start_time = time.time()
mydb = mysql.connector.connect(
  host     = '127.0.0.1',
  user     = 'root',
  password = '',
  database = 'cityu_fyp',
)


# In[3]:


user_id = '1'
type_id = ['0']
settlement_type = ['0']
places = ['0']
tags = ['0']
serach_time = '0'


# In[4]:


search_like_sql = ""
search_view_sql = ""
search_post_sql = ""

def get_day_before(day):
    n_day = day
    today = datetime.datetime.now()
    #today = datetime.datetime(2022, 7, 5)
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
        print(day_before)
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
    serach_day = 365


# In[5]:


get_next_day()


# In[6]:


mycursor = mydb.cursor(buffered=True)

mycursor.execute("SELECT post.*,pt.name AS type,user.name AS posterName, (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id AND pl.status = 1 " + search_like_sql + " ) AS likedNumber , (Select COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = post.id AND pvr.user_id != post.created_by "+ search_view_sql +" ) AS visitedNumber, ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id WHERE post.status = 1 " + search_post_sql)

results = mycursor.fetchall()

mycursor.execute("SELECT COUNT(id) as typeNumber FROM post_type where status = 1")

types_number = mycursor.fetchall()[0][0]

mycursor.execute("SELECT COUNT(id) as typeNumber FROM district")

district_number = mycursor.fetchall()[0][0]

mycursor.execute("SELECT COUNT(id) FROM post_settlement_type WHERE status = 1")

settlement_number = mycursor.fetchall()[0][0]

mycursor.execute("SELECT COUNT(id) as typeNumber FROM region")

region_number = mycursor.fetchall()[0][0]

mycursor.execute("SELECT COUNT(id) FROM post_tag WHERE status = 1")

tag_number = mycursor.fetchall()[0][0]


# In[7]:


settlement_number


# In[8]:


district_number


# In[9]:


region_number


# In[10]:


tag_number


# In[11]:


types_number


# In[12]:


import pandas as pd


# In[13]:


df = pd.DataFrame(data = results,columns=['id','item_name','content','type_id','created_by','create_date','others','status','type','name','liked_number','viewed_number','sTypeID','settlementID','settlementName'])


# In[14]:


df


# In[15]:


viewed_count = sum(df[df['viewed_number'].notnull()]['viewed_number'].astype('int'))
liked_count = sum(df[df['liked_number'].notnull()]['liked_number'].astype('int'))


# In[16]:


viewed_count


# In[17]:


average_view = df['viewed_number'].mean()


# In[18]:


liked_count


# In[19]:


average_like = df['liked_number'].mean()


# In[20]:


for index, row in df.iterrows():
    df.loc[index,'create_date'] = int(time.mktime(row["create_date"].timetuple()))


# In[21]:


df


# In[22]:


import numpy as np
import asyncio
from sklearn.metrics.pairwise import cosine_similarity
from scipy import sparse


# In[23]:


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


# In[24]:


submitted_type_list


# In[25]:


submitted_value.shape


# In[26]:


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


# In[27]:


get_similiarity_score()


# In[28]:


names = df['item_name']
indices = pd.Series(df.index, index=df['item_name'])


# In[29]:


def get_post_like_and_view_each_day(post_id):
    minday = maxday = serach_day
    likes = []
    views = []
    if is_hour:
        print(post_id)
        for i in range (24):
            if i < 10 : 
                ma_day = "" + get_day_before(0) + " 0"+ str(i) +":00:00"
                if i == 9:
                    mi_day = "" + get_day_before(0) + " " + str(int(i+1))  + ":00:00"
                else:
                    mi_day = "" + get_day_before(0) + " 0" + str(int(i)+1)  + ":00:00"
            else:
                ma_day = ""+get_day_before(0) + " " + str(i) +":00:00"
                if i == 23:
                    mi_day = ""+get_next_day() + " 00"+":00:00"
                else:
                    mi_day = ""+get_day_before(0) + " " + str(int(i+1)) +":00:00"
           
            print(ma_day + " " +mi_day)
            mycursor.execute("SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = %s AND pl.status = 1 AND pl.create_date >= %s AND pl.create_date < %s",[post_id,ma_day,mi_day])
            result_likes = mycursor.fetchall()
            mycursor.execute("SELECT COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = %s AND pvr.start_from >= %s AND pvr.start_from < %s",[post_id,ma_day,mi_day])
            result_views = mycursor.fetchall()
            print(result_views)
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
        


# In[30]:


import statistics
import math
import sys
# likes,views = get_post_like_and_view_each_day(202)
# statistics.mean(views)


# In[31]:


def get_most_popular_peroid(target_list):
    #mean_of_list = statistics.mean(target_list)
    mean_of_list = sum(target_list) / len(target_list)
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


# In[32]:


get_most_popular_peroid([-2,1,-3,4,-1,2,1,-5,4])
#get_most_popular_peroid([0,0,0,0,0,0])
#get_most_popular_peroid([5,4,-1,7,8])


# In[33]:


def get_most_popular_peroid_opt(target_list):
    mean_of_list = statistics.mean(target_list)
    current_value = math.floor(target_list[0])
    max_value = current_value
    max_subarray = [0]
    for i in range(1,len(target_list),1):
        nums = math.floor(target_list[i])
        value = current_value + nums - mean_of_list
        if nums > value:
            current_value = nums
            if current_value > max_value:
                max_subarray = [i]
                max_value = current_value
        else:
            current_value = value
            if value >= max_value:
                max_subarray.append(i)
                max_value = value
    return max_subarray,max_value


# In[34]:


#get_most_popular_peroid_opt([-2,1,-3,4,-1,2,1,-5,4])
#get_most_popular_peroid_opt([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0])
#get_most_popular_peroid_opt([5,4,-1,7,8])


# In[35]:


# views


# In[36]:


def weighted_rating(x):
    m = x.count()
    # likes,views = get_post_like_and_view_each_day(x['id'])
    # view_period,_ = get_most_popular_peroid_opt(views)
    # like_period,_ = get_most_popular_peroid_opt(likes)
    # v = x['liked_number'] * (1- view_period[-1]/serach_day)
    # r = x['viewed_number'] * (1-view_period[-1]/serach_day)
    v = x['liked_number'] 
    r = x['viewed_number']
    if v == 0 and r != 0:
        return (r/viewed_count * average_view)
    elif v != 0 and r == 0:
        return (v/liked_count * average_like)
    elif v== 0 and r ==0:
        return 0
    else: 
        return ((v/liked_count) * average_like)  + ((r/viewed_count) * average_view)


# In[37]:


def get_recommendations():
    sim_scores = sorted(np.array(result), key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:31]
    post_indices = [i[0] for i in sim_scores]
    names.iloc[post_indices]
    post = df.iloc[post_indices][['id','item_name','content','type_id','created_by','create_date','others','status','type','name','liked_number','viewed_number','sTypeID','settlementID']]
    return post.head(10)


# In[38]:


# get_recommendations()


# In[39]:


def get_recommendations_with_feature_weigthing():
    sim_scores = sorted(np.array(result), key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:31]
    post_indices = [i[0] for i in sim_scores]
    names.iloc[post_indices]
    post = df.iloc[post_indices][['id','item_name','content','type_id','created_by','create_date','others','status','type','name','liked_number','viewed_number','sTypeID','settlementID']]
    liked_count = post[post['liked_number'].notnull()]['liked_number'].astype('int')
    reommend_post = post;
    reommend_post['viewed_number'] = reommend_post['viewed_number'].astype('int')
    reommend_post['liked_number'] = reommend_post['liked_number'].astype('int')
    reommend_post['rating'] = reommend_post.apply(weighted_rating, axis=1)
    reommend_post = reommend_post.sort_values('rating', ascending=False).head(10)
    return reommend_post


# In[40]:


get_recommendations_with_feature_weigthing()


# In[41]:


def weighted_rating_period(x):
    m = x.count()
    likes,views = get_post_like_and_view_each_day(x['id'])
    view_period,view_count = get_most_popular_peroid_opt(views)
    like_period,like_count = get_most_popular_peroid_opt(likes)
    
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


# In[42]:


def get_recommendations_with_feature_weigthing_period():
    sim_scores = sorted(np.array(result), key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:31]
    post_indices = [i[0] for i in sim_scores]
    names.iloc[post_indices]
    post = df.iloc[post_indices][['id','item_name','content','type_id','created_by','create_date','others','status','type','name','liked_number','viewed_number','sTypeID','settlementID']]
    liked_count = post[post['liked_number'].notnull()]['liked_number'].astype('int')
    reommend_post = post
    reommend_post['viewed_number'] = reommend_post['viewed_number'].astype('int')
    reommend_post['liked_number'] = reommend_post['liked_number'].astype('int')
    reommend_post['rating'] = reommend_post.apply(weighted_rating_period, axis=1)
    reommend_post = reommend_post.sort_values('rating', ascending=False).head(10)
    return reommend_post


# In[43]:


result = get_recommendations_with_feature_weigthing_period()


# In[44]:


result


# In[45]:


result.to_json()


# In[46]:


print("%s seconds "%(time.time() - start_time))


# In[ ]:





# In[ ]:





# In[ ]:




