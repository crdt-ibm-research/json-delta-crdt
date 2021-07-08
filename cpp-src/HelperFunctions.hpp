#pragma once

#include <list>
#include <map>
#include <iterator>
#include <vector>
#include <algorithm>    // std::max

#define DELTA std::pair<CompDotFun, CausalContext>
#define DELTA_POS std::pair<DELTA, int>


template <class K, class V>
std::list<K> get_domain(std::map<K, V> const m) {
	std::list<K> list;
	for (auto it = m.begin(); it != m.end(); ++it) {
		list.push_front(it->first);
	}
	return list;
}

template <typename V>
bool list_contains(std::list<V> l, V d) {
	return (std::find(l.begin(), l.end(), d) != l.end());
}
/*
template <typename container>
container unique_merge(container c1, container c2)
{
	std::sort(c1.begin(), c1.end());
	std::sort(c2.begin(), c2.end());
	container mergeTarget;
	std::merge(c1.begin(), c1.end(), c2.begin(), c2.end(),
		std::insert_iterator(mergeTarget, mergeTarget.end())
	);
	std::erase(
		std::unique(mergeTarget.begin(), mergeTarget.end()),
		mergeTarget.end()
	);

	return mergeTarget;
}*/
