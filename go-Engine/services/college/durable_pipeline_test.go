package collegesvc

import (
	"fmt"
	"strconv"
	"sync"
	"testing"
)

func TestStablePipelineIDDeduplicatesConcurrentRequests(t *testing.T) {
	const requests = 1000
	ids := make(chan string, requests)
	var wait sync.WaitGroup
	for index := 0; index < requests; index++ {
		wait.Add(1)
		go func() {
			defer wait.Done()
			ids <- stableID("university-of-oxford", "2026", defaultPipelineVersion, "1")
		}()
	}
	wait.Wait()
	close(ids)
	unique := map[string]struct{}{}
	for id := range ids {
		unique[id] = struct{}{}
	}
	if len(unique) != 1 {
		t.Fatalf("expected one pipeline ID, got %d", len(unique))
	}
}

func TestStablePipelineIDKeepsDifferentCollegesDistinct(t *testing.T) {
	const colleges = 1000
	unique := map[string]struct{}{}
	for index := 0; index < colleges; index++ {
		id := stableID(fmt.Sprintf("college-%d", index), "2026", defaultPipelineVersion, "1")
		unique[id] = struct{}{}
	}
	if len(unique) != colleges {
		t.Fatalf("expected %d pipeline IDs, got %d", colleges, len(unique))
	}
}

func TestPipelineTaskSpecsHaveUniqueDurableIdentity(t *testing.T) {
	pipelineID := stableID("college", "2026", defaultPipelineVersion, "1")
	specs := pipelineTaskSpecs("College", "college", "India", pipelineID, 2026, 1)
	if len(specs) != 18 {
		t.Fatalf("expected 18 initial tasks, got %d", len(specs))
	}
	unique := map[string]struct{}{}
	for index, spec := range specs {
		id := stableID(pipelineID, spec.TaskType, spec.ModeOrPortal)
		if _, exists := unique[id]; exists {
			t.Fatalf("duplicate task identity at %d", index)
		}
		unique[id] = struct{}{}
		if spec.Payload["pipeline_id"] != pipelineID {
			t.Fatalf("task %s missing pipeline ID", strconv.Itoa(index))
		}
	}
}
