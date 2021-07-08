/*
	Code for testing average number of dots needed to represent a position.
	Compiling requires using the following flags: -std=c++17 -pthread
	
	The command line is:
	./a.out <#threads> <Move probability> <Delta time for collecting stats> <Total test time> <Array size>
	
	Figure 15 is created using the following command:
	./a.out 32 <p> 200 2000 10
	Figure 16 is created using the following command:
	./a.out 32 0.5 200 2000 <size>
	
	The output is the total and average number of dots used to represnt the positions in the array.
*/



#include <iostream>
#include <vector>

#include "DotFun.hpp"
#include "CausalContext.hpp"
#include "CompDotFun.hpp"
#include "Position.hpp"
#include "Replica.hpp"
#include <chrono>
#include <thread>
#include <mutex>
#include <time.h>
#include <random>
#include <atomic>
#include <string> 

#define PRINT(x) std::cout << x << "\n"

std::vector<Replica> replicaVec;
int N = 5;
std::atomic<int> counter;
std::atomic<bool> mywait;
std::atomic<bool> myexit;
float P = 0.4f;// Probability of move
int size = 10;

void addMsg(Replica& r, DELTA_POS d) {
	r.mtx.lock();
	r.msgs.push_back(d);
	r.mtx.unlock();
}

void bcast(DELTA_POS d, int replicaId) {
	for (int i = 0; i < N; i++) {
		if (i == replicaId) continue;
		addMsg(replicaVec[i], d);
	}
}

void runReplica(const int& replicaId) {
	thread_local static std::random_device rd;
	thread_local static std::mt19937 rng(rd());
	thread_local std::uniform_real_distribution<float> urd;
	thread_local std::uniform_int_distribution<int> uid;
	Replica& r = replicaVec[replicaId];
	while (!myexit.load()) {
		while (!myexit.load() && !mywait.load()) {
			int idx = uid(rng, decltype(uid)::param_type{ 0, size-1 });
			float p = urd(rng, decltype(urd)::param_type{ 0,1 });
			DELTA_POS d;
			if (p < P) {
				d = r.move(replicaId, idx);
			}
			else {
				d = r.apply(replicaId, idx);
			}
			bcast(d, replicaId);
			r.try_handle_all();
		}
		counter++;
		while (mywait.load());
	}
}

int main(int argc, char* argv[])
{
	try {
		counter.store(0);
		myexit.store(false);
		mywait.store(false);
		unsigned int ms_wait = 500;
		unsigned int total_test = 1000;

		if (argc > 1) {
			N = std::stoi(argv[1]);
			if ( N == -1) {
				std::cout << "Usage:" << argv[0] << " N P wait total size\n";
				return EXIT_SUCCESS;
			}
		}
		if (argc > 2) {
			P = std::stof(argv[2]);
		}
		if (argc > 3) {
			ms_wait = std::stoul(argv[3]);
		}
		if (argc > 4) {
			total_test = std::stoul(argv[4]);
		}
		if (argc > 5) {
			size = std::stoi(argv[5]);
		}


		std::chrono::milliseconds wait_time(ms_wait);

		for (int i = 0; i < N; i++) {
			replicaVec.push_back(Replica(i * 10, size));
		}

		std::vector<std::thread> threads;

		int num_iters = total_test / ms_wait;

		for (int i = 0; i < N; i++)
		{
			threads.push_back(std::thread(runReplica, i));
		}

		int _sizes = 0;

		for (int i = 0; i < num_iters; i++) {
			std::this_thread::sleep_for(wait_time);
			mywait.store(true);
			int _s = replicaVec[0].size();
			while (counter.load() != N);
			//std::cout << "i: " << i << ", size:" << _s << '\n';
			counter.store(0);
			mywait.store(false);
		}

		myexit.store(true);

		for (int i = 0; i < N; i++)
		{
			threads.at(i).join();
		}

		for (int i = 0; i < N; i++)
		{
			replicaVec[i].handle_all();
		}
		int final_size = replicaVec[0].size();
		std::cout << "Total number of dots:" << final_size << '\n';
		std::cout << "Average number of dots:" << final_size  / (float) size << '\n';
		int size = replicaVec[0].size();
		for (int i = 1; i < N; i++) {
			if (replicaVec[i].size() != size) {
				std::cout << "Error in test" << "\n";
				break;
			}
		}

		/*
		d1 = r1.apply(2);
		std::cout << p1 << "\n";
		PRINT(p1);

		d2 = p2.apply(3);
		p2.merge(d2);
		p2.merge(d1);
		p1.merge(d2);
		PRINT(p2);

		d2 = p2.move(5);
		d1 = p1.move(6);
		p2.merge(d2);
		p2.merge(d1);
		PRINT(p2);
		*/
	}
	catch (const std::exception& e) {
		std::cout << "Exception" << '\n';
	}
	std::cout << "Finished test" << '\n';
	return EXIT_SUCCESS;
}
