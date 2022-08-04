import sys
import mysql.connector
import pandas as pd
import datetime
import time
mydb = mysql.connector.connect(
  host     = 'localhost',
  user     = 'root',
  password = '',
  database = 'cityu_fyp',
)
mycursor = mydb.cursor()

mycursor.execute("SELECT post.*,pt.name AS type,user.name AS posterName, (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(Select COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = post.id AND pvr.user_id != post.created_by) AS visitedNumber " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id WHERE post.status = 1")

results = mycursor.fetchall()

df = pd.DataFrame(data = results,columns=['Id','item_name','content','type_id','created_by','create_date','others','status','type','name','liked_number','viewed_number'])

viewed_count = sum(df[df['viewed_number'].notnull()]['viewed_number'].astype('int'))
liked_count = sum(df[df['liked_number'].notnull()]['liked_number'].astype('int'))

def weighted_rating(x):
    m = x.count()
    v = x['liked_number']
    r = x['viewed_number']
    if v == 0 and r != 0:
        return (r/viewed_count)
    elif v != 0 and r == 0:
        return (v/liked_count)
    elif v== 0 and r ==0:
        return 0
    else: 
        return (v/liked_count) + (r/viewed_count)

df['wr'] = df.apply(weighted_rating, axis=1)

df_sort = df.sort_values('wr', ascending=False).head(20)
print(df_sort.to_json())
sys.stdout.flush()
