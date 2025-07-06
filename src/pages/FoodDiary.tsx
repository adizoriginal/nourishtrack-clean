
import { useAppContext } from "@/contexts/AppContext";
import { FoodDiary as FoodDiaryComponent } from "@/components/food/FoodDiary";

const FoodDiary = () => {
  const { meals, removeFood } = useAppContext();

  return (
    <div className="page-container">
      <h1 className="page-title">Food Diary</h1>
      
      <FoodDiaryComponent 
        meals={meals}
        onRemoveFood={removeFood}
      />
    </div>
  );
};

export default FoodDiary;
