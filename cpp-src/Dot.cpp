#include "Dot.hpp"

Dot::Dot(int num, int replica) : _num(num), _replica(replica) {}

int Dot::Num() const {
	return _num;
}

int Dot::Replica() const {
	return _replica;
}
