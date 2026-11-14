#include<iostream>
#include<vector>
#include<string>
#include<algorithm>

using namespace std;

int foo(string word,vector<string> &vect)
{
    vect;
    int cnt=0;

    for(int i=0;i<vect.size();i++)
    {
        if(vect[i]==word)
        {
            cnt++;
        }
    }
    vect.push_back(word);
    return cnt;

}

int main()
{


}