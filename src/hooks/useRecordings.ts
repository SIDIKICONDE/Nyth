import { Recording } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export const useRecordings = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setIsLoading(true);
      const recordingsData = await AsyncStorage.getItem("recordings");
      if (recordingsData) {
        const parsedRecordings = JSON.parse(recordingsData);
        setRecordings(parsedRecordings);
      }
    } catch (error) {} finally {
      setIsLoading(false);
    }
  };

  const addRecording = async (recording: Recording) => {
    try {
      const updatedRecordings = [...recordings, recording];
      setRecordings(updatedRecordings);
      await AsyncStorage.setItem(
        "recordings",
        JSON.stringify(updatedRecordings)
      );
    } catch (error) {}
  };

  const deleteRecording = async (recordingId: string) => {
    try {
      const updatedRecordings = recordings.filter((r) => r.id !== recordingId);
      setRecordings(updatedRecordings);
      await AsyncStorage.setItem(
        "recordings",
        JSON.stringify(updatedRecordings)
      );
    } catch (error) {}
  };

  return {
    recordings,
    isLoading,
    loadRecordings,
    addRecording,
    deleteRecording,
  };
};
