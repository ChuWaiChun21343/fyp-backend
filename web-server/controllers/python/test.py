from subprocess import call
import time
print('starting')

total_time = 0
n = 10
test_n = "200"
for i in range(n):
    start_time = time.time()
    #call(["python", "/Users/pikachu/NodeJs/fyp/web-server/controllers/python/recommendation_test.py","Turtle Check Men Navy Blue Shirt",test_n])
    call(["python", "/Users/pikachu/NodeJs/fyp/web-server/controllers/python/recommendation_test_no_opt.py","Turtle Check Men Navy Blue Shirt",test_n])
    end_time = time.time() - start_time
    total_time += end_time
    print("%s seconds "%(end_time))

print(total_time/n)

