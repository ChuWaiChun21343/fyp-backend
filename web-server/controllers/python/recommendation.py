from audioop import add
import sys
import statistics
import math
import turtle
import mysql.connector
import pandas as pd
import datetime
import time
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import linear_kernel, cosine_similarity

mydb = mysql.connector.connect(
  host     = '127.0.0.1',
  user     = 'root',
  password = '',
  database = 'test_cityu_fyp',
)

user_id = sys.argv[2]

post_id = sys.argv[3]

serach_day = int(sys.argv[4])

mycursor = mydb.cursor()

mycursor.execute("SELECT post.*,pt.name AS type,user.name AS posterName, (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id AND pl.status = 1) AS likedNumber , (Select COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = post.id AND pvr.user_id != post.created_by) AS visitedNumber, ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id WHERE post.status = 1 and post.created_by != "+ user_id)


results = mycursor.fetchall()

df = pd.DataFrame(data = results,columns=['id','name','content','type_id','created_by','create_date','others','status','belongs_to','type','posterName','liked_number','viewed_number','sTypeID','settlementID','settlementName',])

viewed_count = sum(df[df['viewed_number'].notnull()]['viewed_number'].astype('int'))
liked_count = sum(df[df['liked_number'].notnull()]['liked_number'].astype('int'))

average_view = df['viewed_number'].mean()
average_like = df['liked_number'].mean()


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


def get_post_like_and_view_each_day(post_id):
    minday = maxday = serach_day
    likes = []
    views = []
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


def get_most_popular_peroid_last_day(target_list):
    mean_of_list = statistics.mean(target_list)
    #mean_of_list = sum(target_list) / len(target_list)
    max_value =  float('-inf')
    last_index = 0
    for i in range(len(target_list)):
        current_value  = 0 
        for y in range(i,len(target_list),1):
            current_value = current_value + target_list[y] - mean_of_list
            if current_value > max_value:
                max_value = current_value
                last_index = y
    return last_index,max_value
        

def get_most_popular_peroid_last_day_opt(target_list):
    mean_of_list = statistics.mean(target_list)
    current_value = math.floor(target_list[0]) - mean_of_list;
    max_value = current_value;
    last_index = 0
    for i in range(1,len(target_list),1):
        nums = math.floor(target_list[i]) - mean_of_list
        value = current_value + nums 
        if nums > value:
            current_value = nums
            if current_value > max_value:
                last_index = i
                max_value = current_value
        elif value >= nums and mean_of_list != 0:
            current_value = value
            if current_value >= max_value:
                last_index = i
                max_value = current_value
    return last_index,max_value


def weighted_rating(x):
    likes,views = get_post_like_and_view_each_day(x['id'])
    last_view_day,view_count = get_most_popular_peroid_last_day_opt(views)
    last_like_period,like_count = get_most_popular_peroid_last_day_opt(likes)

    last_view_day = int(last_view_day)+1
    last_like_period = int(last_like_period)+1
    
    if view_count == 0:
        last_view_day = 1
    if like_count == 0:
        last_like_period = 1   

    v = sum(likes) * (last_like_period)/serach_day
    r = sum(views) * (last_view_day)/serach_day

    if v == 0 and r != 0:
        return (r/viewed_count * average_view)
    elif v != 0 and r == 0:
        return (v/liked_count * average_like)
    elif v== 0 and r ==0:
        return 0
    else: 
        return ((v/liked_count) * average_like)  + ((r/viewed_count) * average_view)


tf = TfidfVectorizer(analyzer='word',ngram_range=(1, 2),min_df=0)
tfidf_matrix = tf.fit_transform(df['name'])

cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)


names = df['name']
indices = pd.Series(df.index, index=df['name'])
id_indices = pd.Series(df.index, index= df['id'])

# def recommendation_system(name):
#     index = indices[name]
#     id_index = id_indices[int(post_id)]
#     sim_scores = list(enumerate(cosine_sim[index]))
#     sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
#     for tuple in sim_scores:
#         if tuple[0] == id_index:
#             sim_scores.remove(tuple)
#     if(len(sim_scores) < 20):
#         sim_scores = sim_scores[0:len(sim_scores)]
#     else:
#         sim_scores = sim_scores[0:20]

#     post_indices = [i[0] for i in sim_scores]
    
#     post = df.iloc[post_indices][['id','name','content','type_id','created_by','create_date','others','status','belongs_to','type','posterName','liked_number','viewed_number','sTypeID','settlementID','settlementName',]]
#     qualified = post
#     qualified['viewed_number'] = qualified['viewed_number'].astype('int')
#     qualified['liked_number'] = qualified['liked_number'].astype('int')
#     qualified['rating'] = qualified.apply(weighted_rating, axis=1)
#     if(len(qualified) < 10):
#         qualified = qualified.sort_values('rating', ascending=False).head(len(qualified))
#     else:
#         qualified = qualified.sort_values('rating', ascending=False).head(10)
#     return qualified

def recommendation_system(name):
    index = indices[name]
    id_index = id_indices[int(post_id)]
    sim_scores = list(enumerate(cosine_sim[index]))
    qualified_sim_scores = []
    for tuple in sim_scores:
        if tuple[0] == id_index:
            sim_scores.remove(tuple)
        else: 
            if tuple[1] > 0:
                qualified_sim_scores.append(tuple)

    #no similiar name    
    if len(qualified_sim_scores) == 0:
        qualified_sim_scores = sim_scores
    post_indices = [i[0] for i in qualified_sim_scores]


    post = df.iloc[post_indices][['id','name','content','type_id','created_by','create_date','others','status','belongs_to','type','posterName','liked_number','viewed_number','sTypeID','settlementID','settlementName',]]
    qualified = post
    qualified['viewed_number'] = qualified['viewed_number'].astype('int')
    qualified['liked_number'] = qualified['liked_number'].astype('int')
    qualified['rating'] = qualified.apply(weighted_rating, axis=1)
    if(len(qualified) < 10):
        qualified = qualified.sort_values('rating', ascending=False).head(len(qualified))
    else:
        qualified = qualified.sort_values('rating', ascending=False).head(10)
    return qualified


result = recommendation_system(sys.argv[1])
print(result.to_json())
sys.stdout.flush()
