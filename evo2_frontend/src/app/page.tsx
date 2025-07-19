"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { WalletConnectionHeader } from "../components/wallet-connection-header";
import { SequenceAnalysisComponent } from "../components/sequence-analysis";
import GeneViewer from "../components/gene-viewer";
import { Dna, Search, Database, Coins, FileText } from "lucide-react";
import {
  getAvailableGenomes,
  getGenomeChromosomes,
  searchGenes,
  type GenomeAssemblyFromSearch,
  type ChromosomeFromSeach,
  type GeneFromSearch,
} from "../utils/genome-api";

type Mode = "search" | "browse";

export default function HomePage() {
  // Genome browser state
  const [genomes, setGenomes] = useState<GenomeAssemblyFromSearch[]>([]);
  const [selectedGenome, setSelectedGenome] = useState<string>("hg38");
  const [chromosomes, setChromosomes] = useState<ChromosomeFromSeach[]>([]);
  const [selectedChromosome, setSelectedChromosome] = useState<string>("chr1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<GeneFromSearch[]>([]);
  const [selectedGene, setSelectedGene] = useState<GeneFromSearch | null>(null);
  const [mode, setMode] = useState<Mode>("search");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blockchain features state
  const [showBlockchainFeatures, setShowBlockchainFeatures] = useState(false);

  useEffect(() => {
    const fetchGenomes = async () => {
      try {
        setIsLoading(true);
        const data = await getAvailableGenomes();
        console.log('Genome data:', data);
        if (data.genomes["Human"]) {
          setGenomes(data.genomes["Human"]);
          console.log('Human genomes:', data.genomes["Human"]);
        }
      } catch (err) {
        console.error('Genome fetch error:', err);
        setError("Failed to load genome data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGenomes();
  }, []);

  useEffect(() => {
    const fetchChromosomes = async () => {
      try {
        setIsLoading(true);
        const data = await getGenomeChromosomes(selectedGenome);
        setChromosomes(data.chromosomes);
        // Don't auto-select a chromosome in browse mode, let user click
        if (mode === "browse" && !selectedChromosome) {
          // Initialize with chr1 if no chromosome is selected
          setSelectedChromosome("chr1");
        }
      } catch (err) {
        setError("Failed to load chromosome data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChromosomes();
  }, [selectedGenome]);

  const performGeneSearch = async (
    query: string,
    genome: string,
    filterFn?: (gene: GeneFromSearch) => boolean,
  ) => {
    try {
      setIsLoading(true);
      const data = await searchGenes(query, genome);
      const results = filterFn ? data.results.filter(filterFn) : data.results;
      setSearchResults(results);
    } catch (err) {
      setError("Failed to search genes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedChromosome || mode !== "browse") return;
    
    // Use a more specific search for chromosome browsing
    performGeneSearch(
      `chr:${selectedChromosome}`,
      selectedGenome,
      (gene: GeneFromSearch) => gene.chrom === selectedChromosome,
    );
  }, [selectedChromosome, selectedGenome, mode]);

  const handleGenomeChange = (value: string) => {
    setSelectedGenome(value);
    setSearchResults([]);
    setSelectedGene(null);
  };

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    setSearchResults([]);
    setSelectedGene(null);
    setError(null);
    setMode(newMode);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performGeneSearch(searchQuery, selectedGenome);
    }
  };

  const handleBRCA1Example = () => {
    setSearchQuery("BRCA1");
    setMode("search");
    performGeneSearch("BRCA1", selectedGenome);
  };

  if (selectedGene) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Dna className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  EVO2 <span className="text-gray-500 font-normal">Variant Analysis</span>
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant={showBlockchainFeatures ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowBlockchainFeatures(!showBlockchainFeatures)}
                  className="flex items-center gap-2"
                >
                  <Coins className="h-4 w-4" />
                  {showBlockchainFeatures ? "Hide" : "Show"} Blockchain Features
                </Button>
                <WalletConnectionHeader />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <GeneViewer
            gene={selectedGene}
            genomeId={selectedGenome}
            onClose={() => setSelectedGene(null)}
          />
          
          {/* Blockchain Features Section */}
          {showBlockchainFeatures && (
            <div className="mt-8 space-y-6">
              <Card className="bg-white border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Coins className="h-5 w-5" />
                    Blockchain Features - Mint NFT & Earn Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SequenceAnalysisComponent />
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Dna className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                EVO2 <span className="text-gray-500 font-normal">Variant Analysis</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={showBlockchainFeatures ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBlockchainFeatures(!showBlockchainFeatures)}
                className="flex items-center gap-2"
              >
                <Coins className="h-4 w-4" />
                {showBlockchainFeatures ? "Hide" : "Show"} Blockchain Features
              </Button>
              <WalletConnectionHeader />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Genome Assembly Section */}
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-700">Genome Assembly</CardTitle>
                <span className="text-sm text-gray-500">Organism: Human</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedGenome} - {genomes.find(g => g.id === selectedGenome)?.name || "Dec. 2013 (GRCh38/hg38)"} (active)
                    </h3>
                    <p className="text-sm text-gray-500">
                      {genomes.find(g => g.id === selectedGenome)?.sourceName || "GRCh38 Genome Reference Consortium Human Reference 38 (GCA_000001405.15)"}
                    </p>
                  </div>
                  <Select value={selectedGenome} onValueChange={handleGenomeChange}>
                    <SelectTrigger className="w-66">
                      <SelectValue placeholder="Select genome" />
                    </SelectTrigger>
                    <SelectContent>
                      {genomes.map((genome) => (
                        <SelectItem key={genome.id} value={genome.id}>
                          {genome.id} - {genome.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Browse Section */}
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-gray-700">Browse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={mode} onValueChange={(value) => switchMode(value as Mode)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                  <TabsTrigger 
                    value="search" 
                    className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                  >
                    Search Genes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="browse" 
                    className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                  >
                    Browse Chromosomes
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="search" className="space-y-6">
                  <form onSubmit={handleSearchSubmit} className="space-y-4">
                    <div className="flex gap-3">
                      <Input
                        placeholder="BRCA1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 border-gray-300"
                      />
                      <Button type="submit" className="bg-gray-700 hover:bg-gray-800 text-white px-4">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                  
                  {searchResults.length === 0 && !isLoading && !searchQuery && (
                    <div className="space-y-2">
                      <Button 
                        variant="link" 
                        onClick={handleBRCA1Example}
                        className="text-slate-500 hover:text-slate-700 p-0 h-auto font-normal"
                      >
                        Try BRCA1 example
                      </Button>
                    </div>
                  )}

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600">
                        Search Results: <span className="font-medium">{searchResults.length} genes</span>
                      </div>
                      
                      {/* Table Header */}
                      <div className="bg-gray-50 rounded-t-lg border border-gray-200">
                        <div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm font-medium text-gray-700">
                          <div>Symbol</div>
                          <div>Name</div>
                          <div>Location</div>
                        </div>
                      </div>
                      
                      {/* Table Body */}
                      <div className="border-l border-r border-b border-gray-200 rounded-b-lg">
                        {searchResults.map((gene, index) => (
                          <div 
                            key={index} 
                            className="grid grid-cols-3 gap-4 px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedGene(gene)}
                          >
                            <div className="text-slate-600 hover:text-slate-800 font-medium">
                              {gene.symbol}
                            </div>
                            <div className="text-gray-900">
                              {gene.name}
                            </div>
                            <div className="text-gray-600">
                              {gene.chrom}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="browse" className="space-y-6">
                  {/* Chromosome Grid */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-2">
                      {Array.from({ length: 22 }, (_, i) => i + 1).map((chrNum) => (
                        <Button
                          key={`chr${chrNum}`}
                          variant={selectedChromosome === `chr${chrNum}` ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedChromosome(`chr${chrNum}`)}
                          className="h-8 text-xs"
                        >
                          chr{chrNum}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      {["chrX", "chrY", "chrM"].map((chr) => (
                        <Button
                          key={chr}
                          variant={selectedChromosome === chr ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedChromosome(chr)}
                          className="h-8 text-xs"
                        >
                          {chr}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Chromosome Genes */}
                  {searchResults.length > 0 && selectedChromosome && (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600">
                        Genes on {selectedChromosome}: <span className="font-medium">{searchResults.length} found</span>
                      </div>
                      
                      {/* Table Header */}
                      <div className="bg-gray-50 rounded-t-lg border border-gray-200">
                        <div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm font-medium text-gray-700">
                          <div>Symbol</div>
                          <div>Name</div>
                          <div>Location</div>
                        </div>
                      </div>
                      
                      {/* Table Body */}
                      <div className="border-l border-r border-b border-gray-200 rounded-b-lg">
                        {searchResults.slice(0, 10).map((gene, index) => (
                          <div 
                            key={index} 
                            className="grid grid-cols-3 gap-4 px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedGene(gene)}
                          >
                            <div className="text-slate-600 hover:text-slate-800 font-medium">
                              {gene.symbol}
                            </div>
                            <div className="text-gray-900">
                              {gene.name}
                            </div>
                            <div className="text-gray-600">
                              {gene.chrom}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.length === 0 && selectedChromosome && !isLoading && (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <Database className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-gray-500">Loading genes for {selectedChromosome}...</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Blockchain Features Toggle */}
              {showBlockchainFeatures && (
                <Card className="bg-blue-50 border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Coins className="h-5 w-5" />
                      Blockchain Features - Mint NFT & Earn Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SequenceAnalysisComponent />
                  </CardContent>
                </Card>
              )}

              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2025 EVO2 Variant Analysis Platform. Powered by AI and BNB Smart Chain.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
