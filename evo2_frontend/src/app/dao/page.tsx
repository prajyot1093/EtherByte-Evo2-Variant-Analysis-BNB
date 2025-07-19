"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { WalletConnectionHeader } from "~/components/wallet-connection-header";
import { ArrowLeft, FileText, Users, Clock, CheckCircle, XCircle, Plus, Vote } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  endTime: string;
  category: string;
  hasVoted: boolean;
  userVote?: 'for' | 'against';
}

export default function DAOPage() {
  const { address, isConnected } = useAccount();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userVotingPower, setUserVotingPower] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: 'platform'
  });

  useEffect(() => {
    loadDAOData();
  }, [isConnected, address]);

  const loadDAOData = async () => {
    setLoading(true);
    try {
      // Import blockchain utilities
      const { getAllDAOProposals, getUserDAOVote, getVotingPower } = await import('~/lib/blockchain');
      
      // Fetch real DAO proposals
      const realProposals = await getAllDAOProposals();
      
      // Transform to our UI format and check user votes
      const uiProposals: Proposal[] = await Promise.all(
        realProposals.map(async (proposal: any) => {
          let hasVoted = false;
          let userVote: 'for' | 'against' | undefined;
          
          if (isConnected && address) {
            const vote = await getUserDAOVote(proposal.id, address);
            if (vote) {
              hasVoted = true;
              userVote = vote.choice === 1 ? 'for' : vote.choice === 0 ? 'against' : undefined;
            }
          }
          
          // Determine status based on voting period and execution
          let status: 'active' | 'passed' | 'rejected' | 'pending' = 'pending';
          const now = Math.floor(Date.now() / 1000);
          
          if (proposal.executed) {
            status = 'passed';
          } else if (proposal.canceled) {
            status = 'rejected';
          } else if (now >= proposal.votingStart && now <= proposal.votingEnd) {
            status = 'active';
          } else if (now > proposal.votingEnd) {
            // Voting ended - check if it passed
            const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
            const threshold = totalVotes * 0.5; // Simple majority
            status = proposal.forVotes > threshold ? 'passed' : 'rejected';
          }
          
          const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
          
          return {
            id: proposal.id.toString(),
            title: proposal.title || `Proposal #${proposal.id}`,
            description: proposal.description || "No description provided",
            proposer: `${proposal.proposer.slice(0, 6)}...${proposal.proposer.slice(-4)}`,
            status,
            votesFor: proposal.forVotes,
            votesAgainst: proposal.againstVotes,
            totalVotes,
            endTime: new Date(proposal.votingEnd * 1000).toISOString(),
            category: proposal.proposalType === 0 ? "research" : 
                     proposal.proposalType === 1 ? "platform" :
                     proposal.proposalType === 2 ? "parameter" : "emergency",
            hasVoted,
            userVote
          };
        })
      );
      
      // Get user voting power
      if (isConnected && address) {
        const votingPower = await getVotingPower(address);
        setUserVotingPower(votingPower);
      }
      
      // If no real proposals, show some mock data for demo
      if (uiProposals.length === 0) {
        const mockProposals: Proposal[] = [
          {
            id: "demo1",
            title: "Increase NFT Minting Rewards",
            description: "Proposal to increase GENOME token rewards for NFT minting from 5 to 10 tokens to incentivize more genomic data contributions.",
            proposer: "0x1234...5678",
            status: "active",
            votesFor: 127,
            votesAgainst: 43,
            totalVotes: 170,
            endTime: "2024-01-25T10:00:00Z",
            category: "rewards",
            hasVoted: false
          }
        ];
        setProposals(mockProposals);
      } else {
        setProposals(uiProposals);
      }
      
    } catch (error) {
      console.error('Error loading DAO data:', error);
      // Fallback to mock data
      setProposals([]);
      setUserVotingPower(25);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: string, vote: 'for' | 'against') => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (userVotingPower === 0) {
      alert('You need GENOME tokens to vote');
      return;
    }

    try {
      // Import blockchain utilities
      const { voteOnProposal, createWalletClientFromWindow } = await import('~/lib/blockchain');
      
      const walletClient = createWalletClientFromWindow();
      if (!walletClient) {
        alert('Could not connect to wallet');
        return;
      }
      
      const choice = vote === 'for' ? 1 : 0; // 0=Against, 1=For, 2=Abstain
      const reason = `Voted ${vote} via UI`;
      
      console.log(`Voting ${vote} on proposal ${proposalId}`);
      
      const hash = await voteOnProposal(
        walletClient,
        address!,
        parseInt(proposalId),
        choice,
        reason
      );
      
      if (hash) {
        alert(`Successfully voted ${vote}! Transaction hash: ${hash}`);
        
        // Update local state for immediate feedback
        setProposals(prev => 
          prev.map(proposal => 
            proposal.id === proposalId 
              ? { 
                  ...proposal, 
                  hasVoted: true, 
                  userVote: vote,
                  votesFor: proposal.votesFor + (vote === 'for' ? userVotingPower : 0),
                  votesAgainst: proposal.votesAgainst + (vote === 'against' ? userVotingPower : 0),
                  totalVotes: proposal.totalVotes + userVotingPower
                }
              : proposal
          )
        );
        
        // Reload DAO data to get latest state
        setTimeout(() => {
          loadDAOData();
        }, 2000);
      } else {
        alert('Voting failed. Please try again.');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Voting failed. Please check your wallet and try again.');
    }
  };

  const handleCreateProposal = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!newProposal.title || !newProposal.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Import blockchain utilities
      const { createDAOProposal, createWalletClientFromWindow } = await import('~/lib/blockchain');
      
      const walletClient = createWalletClientFromWindow();
      if (!walletClient) {
        alert('Could not connect to wallet');
        return;
      }
      
      // Map category to proposal type
      const proposalTypeMap: { [key: string]: number } = {
        'research': 0,
        'platform': 1,
        'parameter': 2,
        'governance': 3
      };
      
      const proposalType = proposalTypeMap[newProposal.category] || 1;
      
      console.log('Creating proposal:', newProposal);
      
      const hash = await createDAOProposal(
        walletClient,
        address!,
        newProposal.title,
        newProposal.description,
        "", // ipfsHash - TODO: upload to IPFS for detailed proposals
        0, // fundingAmount - TODO: add funding field to UI
        0, // genomeTokenAmount - TODO: add token amount field to UI
        proposalType
      );
      
      if (hash) {
        alert(`Proposal created successfully! Transaction hash: ${hash}`);
        setShowCreateModal(false);
        setNewProposal({ title: '', description: '', category: 'platform' });
        
        // Reload DAO data to show new proposal
        setTimeout(() => {
          loadDAOData();
        }, 3000);
      } else {
        alert('Proposal creation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Proposal creation failed. Please check your wallet and try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      platform: 'bg-purple-100 text-purple-800',
      rewards: 'bg-green-100 text-green-800', 
      marketplace: 'bg-blue-100 text-blue-800',
      governance: 'bg-orange-100 text-orange-800'
    };
    return <Badge className={colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{category}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link href="/blockchain">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Blockchain
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-orange-600" />
                  DAO Governance
                </h1>
                <p className="text-sm text-gray-600">Participate in platform governance and shape the future</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <WalletConnectionHeader />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Voting Stats */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">Voting Power</p>
                    <p className="text-2xl font-bold">{userVotingPower}</p>
                  </div>
                  <Vote className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Proposals Voted</p>
                    <p className="text-2xl font-bold">{proposals.filter(p => p.hasVoted).length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Active Proposals</p>
                    <p className="text-2xl font-bold">{proposals.filter(p => p.status === 'active').length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Total Proposals</p>
                    <p className="text-2xl font-bold">{proposals.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Proposal Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Active Proposals</h2>
          <Button 
            onClick={() => setShowCreateModal(true)}
            disabled={!isConnected}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Proposal
          </Button>
        </div>

        {/* Proposals List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading proposals...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="bg-white">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(proposal.status)}
                        {getCategoryBadge(proposal.category)}
                      </div>
                      <CardTitle className="text-lg mb-2">{proposal.title}</CardTitle>
                      <p className="text-gray-600 text-sm">{proposal.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Voting Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Voting Progress</span>
                        <span className="text-sm font-medium">{proposal.totalVotes} votes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${proposal.totalVotes > 0 ? (proposal.votesFor / proposal.totalVotes) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-green-600">For: {proposal.votesFor}</span>
                        <span className="text-red-600">Against: {proposal.votesAgainst}</span>
                      </div>
                    </div>

                    {/* Proposal Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Proposer:</span>
                        <span className="ml-2 font-mono">{proposal.proposer}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">End Time:</span>
                        <span className="ml-2">{new Date(proposal.endTime).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Voting Buttons */}
                    {proposal.status === 'active' && (
                      <div className="flex gap-2 pt-2">
                        {proposal.hasVoted ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4" />
                            You voted {proposal.userVote} with {userVotingPower} voting power
                          </div>
                        ) : (
                          <>
                            <Button 
                              onClick={() => handleVote(proposal.id, 'for')}
                              disabled={!isConnected || userVotingPower === 0}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Vote For
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleVote(proposal.id, 'against')}
                              disabled={!isConnected || userVotingPower === 0}
                              className="flex items-center gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Vote Against
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Proposal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>Create New Proposal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={newProposal.title}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter proposal title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select 
                    value={newProposal.category}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="platform">Platform</option>
                    <option value="rewards">Rewards</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="governance">Governance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={newProposal.description}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your proposal in detail"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateProposal} className="flex-1">
                    Create Proposal
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
