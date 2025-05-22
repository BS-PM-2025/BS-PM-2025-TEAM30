// components/SearchSidebar.js
// components/SearchSidebar.js
import { useState } from "react";

const getFoodEmoji = (type) => {
  switch (type) {
    case "פיצה": return "🍕";
    case "המבורגר": return "🍔";
    case "סושי": return "🍣";
    case "קפה": return "☕";
    default: return "🍽️";
  }
};

const SearchSidebar = ({
  search, setSearch,
  destination, setDestination,
  isLoggedIn, setShowLoginMessage,
  handleDestinationSearch,
  setRating,
  loadLevelFilter, setLoadLevelFilter,
  radius, setRadius,
  showCircle, setShowCircle,
  circleRef,
  useTimeFilter, setUseTimeFilter,
  onlyVisited, handleOnlyVisitedChange
}) => {
  const [activeTab, setActiveTab] = useState("location");
  const [selectedFoodType, setSelectedFoodType] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);

  const handleFoodClick = (type) => {
    setSelectedFoodType(type);
    setSearch(type);
  };

  return (
    <aside className="sidebar">
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "location" ? "active-yellow" : ""}`}
          onClick={() => setActiveTab("location")}
        >
          חיפוש לפי מיקום המסעדה
        </button>
        <button
          className={`tab-button ${activeTab === "preferences" ? "active-yellow" : ""}`}
          onClick={() => setActiveTab("preferences")}
        >
          חיפוש לפי העדפות
        </button>
      </div>

      {activeTab === "location" && (
        <>
          <h3 className="title">מסעדה טובה מתחילה במסלול נכון</h3>
          <p className="subtitle">מצא מסעדות לפי מיקום נוכחי, יעד, או כתובת בדרך</p>
          <input
            type="text"
            placeholder="בחר מסעדה"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="לאן תרצה להגיע?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <button className="search-btn" onClick={handleDestinationSearch}>חפש</button>
          <button
            style={{
              backgroundColor: '#ffd700',
              color: 'black',
              fontWeight: 'bold',
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              marginTop: '10px',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (!isLoggedIn) {
                setShowLoginMessage(true);
                return;
              }
              window.location.href = '/saved';
            }}
          >
            מסעדות שמורות
          </button>
        </>
      )}

      {activeTab === "preferences" && (
        <>
          <h3 className="title">חיפוש לפי העדפות</h3>

          <div className="food-icons">
  {["קפה", "סושי", "המבורגר", "פיצה"].map((type) => (
    <button
      key={type}
      className={`food-button ${selectedFoodType === type ? "selected" : ""}`}
      onClick={() => {
        setSelectedFoodType(type);
        if (type === "המבורגר") {
          setSearch("burger");
        } else {
          setSearch(type);
        }
      }}
    >
      <div className="food-icon">{getFoodEmoji(type)}</div>
      <div>{type}</div>
    </button>
  ))}
</div>


          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={selectedRating >= star ? "star selected" : "star"}
                onClick={() => {
                  setSelectedRating(star);
                  setRating(star.toString());
                }}
              >
                ★
              </span>
            ))}
          </div>

          <label>
            רמת עומס:
            <select
              value={loadLevelFilter}
              onChange={(e) => setLoadLevelFilter(e.target.value)}
            >
              <option value="">ללא סינון</option>
              <option value="low">נמוך</option>
              <option value="medium">בינוני</option>
              <option value="high">גבוה</option>
            </select>
          </label>

          <label>
            מרחק:
            <select value={radius || ''} onChange={(e) => setRadius(parseInt(e.target.value))}>
              <option value="">בחר רדיוס</option>
              <option value="500">500 מטר</option>
              <option value="1000">1000 מטר</option>
              <option value="1500">1500 מטר</option>
              <option value="2000">2000 מטר</option>
              <option value="3000">3000 מטר</option>
            </select>
          </label>

          <div className="filters-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={showCircle}
                onChange={() => {
                  if (showCircle && circleRef.current) {
                    circleRef.current.setMap(null);
                    circleRef.current = null;
                  }
                  setShowCircle(!showCircle);
                }}
              />
              הצג טבעת רדיוס
            </label>

            <label>
              <input
                type="checkbox"
                checked={useTimeFilter}
                onChange={(e) => setUseTimeFilter(e.target.checked)}
              />
              מיון לפי שעה
            </label>

            <label>
              <input
                type="checkbox"
                checked={onlyVisited}
                onChange={handleOnlyVisitedChange}
              />
              מסעדות שביקרתי בהן
            </label>
          </div>

          <button className="search-btn" onClick={handleDestinationSearch}>
            חפש
          </button>
        </>
      )}
    </aside>
  );
};
export default SearchSidebar;

