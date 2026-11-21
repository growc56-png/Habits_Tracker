#include<iostream>
#include<vector>
#include<string>
#include<algorithm>
#include<set>

using namespace std;


int main()
{

    int t; cin >> t;
    vector<int> nums;

    for(int i=0;i<t;i++)
    {
        int num; cin >> num;
        nums.push_back(num);
    }

    int cnt=0;

    for(int i=0;i<t-1;i++)
    {
        if(nums[i]==-1 && nums[i+1]==cnt)
        {
            cnt++;
            if(nums[i+1]==cnt)
            {
                cnt=0;
            }
        }
        if(nums[i]==1)
        {

        }
    }
    cout << cnt;





}