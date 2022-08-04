import sys
import statistics
import math
import mysql.connector
import pandas as pd
import datetime
import time
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel, cosine_similarity

mydb = mysql.connector.connect(
  host     = '127.0.0.1',
  user     = 'root',
  password = '',
  database = 'cityu_fyp',
)

serach_day = int(sys.argv[2])

mycursor = mydb.cursor()

mycursor.execute("SELECT post.*,pt.name AS type,user.name AS posterName, (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id AND pl.status = 1) AS likedNumber , (Select COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = post.id AND pvr.user_id != post.created_by) AS visitedNumber, ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id WHERE post.status = 1 ")


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
        

def get_most_popular_peroid_opt(target_list):
    mean_of_list = statistics.mean(target_list)
    current_value = math.floor(target_list[0]) - mean_of_list
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


def weighted_rating(x):
    likes,views = get_post_like_and_view_each_day(x['id'])
    view_period,view_count = get_most_popular_peroid_opt(views)
    like_period,like_count = get_most_popular_peroid_opt(likes)
    m = x.count()
    
    view_period = view_period[-1]+1
    like_period = like_period[-1]+1

    if view_count == 0:
        view_period = 1
    if like_count == 0:
        like_period = 1   

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

df['rating'] = df.apply(weighted_rating, axis=1)

df_sort = df.sort_values('rating', ascending=False).head(20)

tf = TfidfVectorizer(analyzer='word',ngram_range=(1, 2),min_df=0, stop_words='english')
tfidf_matrix = tf.fit_transform(df['name'])

cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

names = df['name']
indices = pd.Series(df.index, index=df['name'])


def improve_recommendation_system(name):
    idx = indices[name]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:31]
    post_indices = [i[0] for i in sim_scores]
    
    post = df.iloc[post_indices][['id','name','content','type_id','created_by','create_date','others','status','belongs_to','type','posterName','liked_number','viewed_number','sTypeID','settlementID','settlementName',]]
    vote_counts = post[post['liked_number'].notnull()]['liked_number'].astype('int')
    # vote_averages = post[post['viewed_number'].notnull()]['viewed_number'].astype('int')
    # C = vote_averages.mean()
    # m = vote_counts.quantile(0.60)
    qualified = post
    qualified['viewed_number'] = qualified['viewed_number'].astype('int')
    qualified['liked_number'] = qualified['liked_number'].astype('int')
    qualified['rating'] = qualified.apply(weighted_rating, axis=1)
    qualified = qualified.sort_values('rating', ascending=False).head(20)
    return qualified

# result = improve_recommendation_system('Manchester United Men Solid Black Track Pants')
result = improve_recommendation_system(sys.argv[1])
# print(result.to_json())
sys.stdout.flush()
