package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

type HubSearchResult struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Stars       int    `json:"stars"`
	Official    bool   `json:"official"`
}

type HubTag struct {
	Name string `json:"name"`
	Size string `json:"size"`
}

type hubSearchResponse struct {
	Results []struct {
		RepoName         string `json:"repo_name"`
		ShortDescription string `json:"short_description"`
		StarCount        int    `json:"star_count"`
		IsOfficial       bool   `json:"is_official"`
	} `json:"results"`
}

type hubTagsResponse struct {
	Next    string `json:"next"`
	Results []struct {
		Name     string `json:"name"`
		FullSize int64  `json:"full_size"`
	} `json:"results"`
}

func SearchHub(query string) ([]HubSearchResult, error) {
	url := fmt.Sprintf("https://hub.docker.com/v2/search/repositories/?query=%s&page_size=10", query)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()
	var data hubSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	out := make([]HubSearchResult, len(data.Results))
	for i, r := range data.Results {
		out[i] = HubSearchResult{Name: r.RepoName, Description: r.ShortDescription, Stars: r.StarCount, Official: r.IsOfficial}
	}
	return out, nil
}

func HubTags(name string) ([]HubTag, error) {
	ns := "library/" + name
	if strings.Contains(name, "/") {
		ns = name
	}
	
	var out []HubTag
	url := fmt.Sprintf("https://hub.docker.com/v2/repositories/%s/tags/?page_size=100", ns)
	
	for url != "" {
		resp, err := http.Get(url)
		if err != nil {
			return out, err
		}

		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		var data hubTagsResponse
		if err := json.Unmarshal(body, &data); err != nil {
			return out, err
		}

		for _, r := range data.Results {
			out = append(out, HubTag{Name: r.Name, Size: formatSize(r.FullSize)})
		}
		url = data.Next
	}

	return out, nil
}
