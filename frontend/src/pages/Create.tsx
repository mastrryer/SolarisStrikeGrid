import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Create = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [matches, setMatches] = useState<string[]>(["", ""]);
  const [formData, setFormData] = useState({
    gridId: "",
    entryFee: "",
    duration: "86400",
  });

  const addMatch = () => {
    if (matches.length < 12) {
      setMatches([...matches, ""]);
    }
  };

  const removeMatch = (index: number) => {
    if (matches.length > 2) {
      setMatches(matches.filter((_, i) => i !== index));
    }
  };

  const updateMatch = (index: number, value: string) => {
    const newMatches = [...matches];
    newMatches[index] = value;
    setMatches(newMatches);
  };

  const steps = ["Basic Info", "Matches", "Review"];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-gradient-cyber">Create Prediction Grid</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Set up your custom prediction market
          </p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      index <= currentStep
                        ? "bg-gradient-to-r from-primary to-secondary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-sm mt-2 ${
                      index <= currentStep ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-all ${
                      index < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step 1: Basic Info */}
        {currentStep === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Grid Configuration</CardTitle>
                <CardDescription>Set the basic parameters for your prediction grid</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="gridId">Grid ID</Label>
                  <Input
                    id="gridId"
                    placeholder="e.g., EPL-Week-42"
                    value={formData.gridId}
                    onChange={(e) => setFormData({ ...formData, gridId: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    A unique identifier for your prediction grid
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryFee">Entry Fee (ETH)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.01"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: 0.001 ETH
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3600">1 Hour</SelectItem>
                      <SelectItem value="86400">1 Day</SelectItem>
                      <SelectItem value="604800">1 Week</SelectItem>
                      <SelectItem value="2592000">30 Days</SelectItem>
                      <SelectItem value="7776000">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => setCurrentStep(1)} className="w-full" size="lg">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Matches */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Add Matches</CardTitle>
                <CardDescription>
                  Add 2-12 matches for your prediction grid
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {matches.map((match, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Match ${index + 1} label`}
                      value={match}
                      onChange={(e) => updateMatch(index, e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMatch(index)}
                      disabled={matches.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {matches.length < 12 && (
                  <Button
                    variant="outline"
                    onClick={addMatch}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Match
                  </Button>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(0)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(2)} className="flex-1">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle>Review & Create</CardTitle>
                <CardDescription>Confirm your grid details before creation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium">Grid Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Grid ID</dt>
                      <dd className="font-medium">{formData.gridId || "Not set"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Entry Fee</dt>
                      <dd className="font-medium">{formData.entryFee || "0"} ETH</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Duration</dt>
                      <dd className="font-medium">
                        {formData.duration === "3600" && "1 Hour"}
                        {formData.duration === "86400" && "1 Day"}
                        {formData.duration === "604800" && "1 Week"}
                        {formData.duration === "2592000" && "30 Days"}
                        {formData.duration === "7776000" && "90 Days"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Matches</dt>
                      <dd className="font-medium">{matches.length}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    size="lg"
                  >
                    Create Grid
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Create;
