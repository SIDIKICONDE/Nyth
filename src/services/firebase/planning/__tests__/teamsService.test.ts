import "./setup";
import { TeamsService } from "../teamsService";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "@react-native-firebase/firestore";

jest.mock("@react-native-firebase/firestore");

describe("TeamsService#getUserTeams", () => {
  const service = new TeamsService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retourne les équipes (owner + member) fusionnées et triées", async () => {
    const userId = "u1";

    const ownerSnap = {
      docs: [
        {
          id: "t1",
          data: () => ({ name: "A", updatedAt: "2025-01-02T10:00:00Z" }),
        },
      ],
    } as unknown as FirebaseFirestoreTypes.QuerySnapshot;

    const memberSnap = {
      docs: [
        {
          id: "t2",
          data: () => ({ name: "B", updatedAt: "2025-01-03T10:00:00Z" }),
        },
        {
          id: "t1",
          data: () => ({ name: "A", updatedAt: "2025-01-02T10:00:00Z" }),
        },
      ],
    } as unknown as FirebaseFirestoreTypes.QuerySnapshot;

    (getFirestore as jest.Mock).mockReturnValue({});
    (collection as jest.Mock).mockReturnValue("teams-col");
    (query as jest.Mock).mockImplementation((...args: unknown[]) => args);
    (where as jest.Mock).mockImplementation(() => ({}));
    (orderBy as jest.Mock).mockImplementation(() => ({}));
    (limit as jest.Mock).mockImplementation(() => ({}));

    let callIndex = 0;
    (getDocs as jest.Mock).mockImplementation(() => {
      return callIndex++ === 0 ? ownerSnap : memberSnap;
    });

    const res = await service.getUserTeams(userId);

    expect(getFirestore).toHaveBeenCalled();
    expect(collection).toHaveBeenCalledWith({}, "teams");
    expect(getDocs).toHaveBeenCalledTimes(2);
    expect(res.map((t) => t.id)).toEqual(["t2", "t1"]);
  });
});
